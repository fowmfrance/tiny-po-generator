// sync-calendar — sync incrémentale d'une connexion Google Calendar (§4.1).
// Appelée : manuellement (front), par le webhook push, ou par cron.
// verify_jwt = false : accepte soit un JWT user, soit un secret cron (CRON_SECRET).
// Corps : { connection_id }.
import {
  corsHeaders, json, adminClient, getFreshAccessToken, listEvents, computeIsExternal,
} from '../_shared/google.ts';

const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

// Filtre ingestion (§4.1) : on ignore les événements sans invités ET sans lieu.
function keep(ev: any): boolean {
  const hasAttendees = Array.isArray(ev.attendees) && ev.attendees.length > 0;
  const hasLocation = !!ev.location;
  return hasAttendees || hasLocation;
}

async function syncConnection(sb: any, connectionId: string) {
  const { data: conn, error } = await sb
    .from('integration_connections').select('*').eq('id', connectionId).single();
  if (error || !conn) throw new Error('connexion introuvable');

  const accessToken = await getFreshAccessToken(sb, conn);

  // Domaine tenant pour is_external : dérivé de l'email du porteur (TODO : org domain).
  const { data: profile } = await sb.from('profiles').select('email').eq('id', conn.user_id).maybeSingle();
  const tenantDomain = profile?.email?.split('@')[1] ?? null;

  const timeMin = new Date(Date.now() - 90 * 864e5).toISOString(); // −90 j
  const timeMax = new Date(Date.now() + 7 * 864e5).toISOString();  // +7 j

  let pageToken: string | undefined;
  let syncToken = conn.sync_token as string | null;
  let nextSyncToken: string | undefined;
  let upserts = 0;

  do {
    let page = await listEvents(accessToken, { syncToken, pageToken, timeMin, timeMax });
    if (page.__gone) {
      // 410 : syncToken expiré → full resync sans syncToken.
      syncToken = null;
      page = await listEvents(accessToken, { pageToken: undefined, timeMin, timeMax });
    }

    for (const ev of page.items ?? []) {
      if (ev.status === 'cancelled') {
        await sb.from('te_calendar_events').delete()
          .eq('connection_id', connectionId).eq('external_event_id', ev.id);
        continue;
      }
      if (!keep(ev)) continue;

      await sb.from('te_calendar_events').upsert({
        user_id: conn.user_id,
        connection_id: connectionId,
        external_event_id: ev.id,
        ical_uid: ev.iCalUID ?? null,
        title: ev.summary ?? null,
        description: ev.description ?? null,
        location_raw: ev.location ?? null,
        starts_at: ev.start?.dateTime ?? ev.start?.date,
        ends_at: ev.end?.dateTime ?? ev.end?.date,
        attendees: ev.attendees ?? [],
        is_external: computeIsExternal(ev.attendees ?? [], tenantDomain),
        organizer_email: ev.organizer?.email ?? null,
        google_status: ev.status ?? null,
        raw: ev,
        // organization_id rempli par trigger
      }, { onConflict: 'connection_id,external_event_id' });
      upserts++;
      // TODO : géocodage async de location_raw (§4.1).
      // TODO : déclencher match-expense en sens inverse (capture proactive, §5.3).
    }

    pageToken = page.nextPageToken;
    if (page.nextSyncToken) nextSyncToken = page.nextSyncToken;
  } while (pageToken);

  await sb.from('integration_connections').update({
    sync_token: nextSyncToken ?? syncToken,
    last_synced_at: new Date().toISOString(),
  }).eq('id', connectionId);

  return upserts;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    // Auth : soit secret cron, soit JWT user (vérif allégée ici — le service role
    // fait l'écrit ; TODO : valider que la connexion appartient bien à l'appelant JWT).
    const cronHeader = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('authorization');
    if (!authHeader && cronHeader !== CRON_SECRET) return json({ error: 'Unauthorized' }, 401);

    const { connection_id } = await req.json();
    if (!connection_id) return json({ error: 'connection_id requis' }, 400);

    const count = await syncConnection(adminClient(), connection_id);
    return json({ ok: true, upserts: count });
  } catch (e) {
    console.error('sync-calendar:', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});
