// sync-calendar — sync incrémentale d'une connexion Google Calendar (§4.1).
// Appelée : manuellement (front), par le webhook push, ou par cron.
// verify_jwt = false : accepte soit un JWT user, soit un secret cron (CRON_SECRET).
// Corps : { connection_id, days_back? } — days_back (défaut 30, borné 7–365) ne
// s'applique qu'aux full sync ; s'il est passé explicitement, on force un full
// resync pour honorer la nouvelle fenêtre (déduplication garantie par
// UNIQUE(connection_id, external_event_id) + upsert).
import {
  corsHeaders, json, adminClient, getFreshAccessToken, listEvents, computeIsExternal,
} from '../_shared/google.ts';

const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

// Filtre ingestion (§4.1) : on ignore les événements sans invités ET sans lieu…
// SAUF si le titre évoque un repas (déj, resto, dîner, café…) : un « Déj » noté
// sans invité ni adresse est précisément le RDV qui génère une note de frais.
const MEAL_TITLE = new RegExp(
  "(^|[^\\p{L}])(d[ée]j|d[ée]jeuner|lunch|resto|restaurant|d[îi]ner|dinner|caf[ée]|coffee|petit[- ]d[ée]j\\w*|ap[ée]ro|brunch)([^\\p{L}]|$)",
  'iu',
);
function keep(ev: any): boolean {
  const hasAttendees = Array.isArray(ev.attendees) && ev.attendees.length > 0;
  const hasLocation = !!ev.location;
  const mealTitle = MEAL_TITLE.test(ev.summary ?? '');
  return hasAttendees || hasLocation || mealTitle;
}

async function syncConnection(sb: any, connectionId: string, daysBack?: number) {
  const { data: conn, error } = await sb
    .from('integration_connections').select('*').eq('id', connectionId).single();
  if (error || !conn) throw new Error('connexion introuvable');

  const accessToken = await getFreshAccessToken(sb, conn);

  // Domaine tenant pour is_external : dérivé de l'email du porteur (TODO : org domain).
  const { data: profile } = await sb.from('profiles').select('email').eq('id', conn.user_id).maybeSingle();
  const tenantDomain = profile?.email?.split('@')[1] ?? null;

  const days = Math.min(365, Math.max(7, daysBack ?? 30)); // défaut : 30 derniers jours
  const timeMin = new Date(Date.now() - days * 864e5).toISOString();
  const timeMax = new Date(Date.now() + 7 * 864e5).toISOString();

  let contacts = 0;
  let pageToken: string | undefined;
  // Fenêtre demandée explicitement → full resync (le syncToken ignorerait timeMin).
  let syncToken = daysBack != null ? null : (conn.sync_token as string | null);
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

      // Lieu → sous-objet te_places (réutilisable ; géocodage plus tard).
      let placeId: string | null = null;
      if (ev.location) {
        const { data: place } = await sb.from('te_places').upsert(
          { user_id: conn.user_id, label: ev.location },
          { onConflict: 'user_id,label' },
        ).select('id').single();
        placeId = place?.id ?? null;
      }

      const { data: row, error: evErr } = await sb.from('te_calendar_events').upsert({
        user_id: conn.user_id,
        connection_id: connectionId,
        external_event_id: ev.id,
        ical_uid: ev.iCalUID ?? null,
        title: ev.summary ?? null,
        description: ev.description ?? null,
        location_raw: ev.location ?? null,
        place_id: placeId,
        recurring_event_id: ev.recurringEventId ?? null,
        starts_at: ev.start?.dateTime ?? ev.start?.date,
        ends_at: ev.end?.dateTime ?? ev.end?.date,
        attendees: ev.attendees ?? [],
        is_external: computeIsExternal(ev.attendees ?? [], tenantDomain),
        organizer_email: ev.organizer?.email ?? null,
        google_status: ev.status ?? null,
        raw: ev,
        // organization_id rempli par trigger.
        // ⚠️ kanban_bucket JAMAIS écrit ici : le classement utilisateur survit aux resynchros.
      }, { onConflict: 'connection_id,external_event_id' }).select('id').single();
      if (evErr) console.error('upsert te_calendar_events:', evErr.message);
      upserts++;

      // Participants → sous-objets te_contacts + lien te_event_attendees
      // (clé de résolution CRM = email ; salles/ressources et soi-même exclus).
      console.log('evt', ev.id, 'row?', !!row?.id,
        'att:', Array.isArray(ev.attendees) ? ev.attendees.length : typeof ev.attendees);
      if (row?.id && Array.isArray(ev.attendees)) {
        for (const a of ev.attendees) {
          const email = (a?.email ?? '').toLowerCase();
          if (!email || a?.self || a?.resource) {
            console.log('skip attendee', JSON.stringify({ email, self: a?.self, resource: a?.resource }));
            continue;
          }
          const dn: string | null = a.displayName ?? null;
          const parts = (dn ?? '').split(' ').filter(Boolean);
          const dom = email.split('@')[1] ?? null;
          const external = !!(tenantDomain && dom && dom !== tenantDomain.toLowerCase());
          const { data: contact, error: cErr } = await sb.from('te_contacts').upsert({
            user_id: conn.user_id,
            email,
            display_name: dn,
            first_name: parts[0] ?? null,
            last_name: parts.length > 1 ? parts.slice(1).join(' ') : null,
            company_domain: external ? dom : null,
          }, { onConflict: 'user_id,email' }).select('id').single();
          if (cErr) console.error('upsert te_contacts:', cErr.message);
          if (contact?.id) {
            contacts++;
            const { error: aErr } = await sb.from('te_event_attendees').upsert({
              user_id: conn.user_id,
              event_id: row.id,
              contact_id: contact.id,
              response_status: a.responseStatus ?? null,
              is_external: external,
            }, { onConflict: 'event_id,contact_id' });
            if (aErr) console.error('upsert te_event_attendees:', aErr.message);
          }
        }
      }
      // TODO : géocodage async des te_places (§4.1).
      // TODO : déclencher match-expense en sens inverse (capture proactive, §5.3).
    }

    pageToken = page.nextPageToken;
    if (page.nextSyncToken) nextSyncToken = page.nextSyncToken;
  } while (pageToken);

  await sb.from('integration_connections').update({
    sync_token: nextSyncToken ?? syncToken,
    last_synced_at: new Date().toISOString(),
  }).eq('id', connectionId);

  return { upserts, contacts };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    // Auth : soit secret cron, soit JWT user (vérif allégée ici — le service role
    // fait l'écrit ; TODO : valider que la connexion appartient bien à l'appelant JWT).
    const cronHeader = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('authorization');
    if (!authHeader && cronHeader !== CRON_SECRET) return json({ error: 'Unauthorized' }, 401);

    const { connection_id, days_back } = await req.json();
    if (!connection_id) return json({ error: 'connection_id requis' }, 400);

    const res = await syncConnection(adminClient(), connection_id,
      days_back != null ? Number(days_back) : undefined);
    return json({ ok: true, ...res });
  } catch (e) {
    console.error('sync-calendar:', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});
