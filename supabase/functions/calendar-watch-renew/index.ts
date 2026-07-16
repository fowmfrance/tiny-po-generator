// calendar-watch-renew — renouvelle les channels push Google Calendar (§4.1).
// Les channels expirent (~7 j max) : le cron quotidien te-frais-watch-renew
// appelle cette fonction, qui :
//   1. re-watch les connexions dont watch_expires_at est nul ou < now + 24 h ;
//   2. déclenche une sync incrémentale de chaque connexion active (filet de
//      sécurité si un push s'est perdu).
// verify_jwt = false : appelée par pg_cron avec x-cron-secret uniquement.
import {
  corsHeaders, json, adminClient, env, getFreshAccessToken, watchCalendar,
} from '../_shared/google.ts';

const CRON_SECRET = env('CRON_SECRET');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const sb = adminClient();
    const { data: conns, error } = await sb.from('integration_connections')
      .select('*')
      .eq('provider', 'google_calendar')
      .eq('status', 'active');
    if (error) throw new Error(error.message);

    const soon = new Date(Date.now() + 24 * 3600e3);
    let renewed = 0, synced = 0, failed = 0;

    for (const conn of conns ?? []) {
      try {
        const needsWatch = !conn.watch_expires_at || new Date(conn.watch_expires_at) < soon;
        if (needsWatch) {
          const accessToken = await getFreshAccessToken(sb, conn);
          const watch = await watchCalendar(accessToken, crypto.randomUUID());
          await sb.from('integration_connections').update({
            watch_channel_id: watch.id,
            watch_resource_id: watch.resourceId ?? null,
            watch_expires_at: watch.expiration ? new Date(Number(watch.expiration)).toISOString() : null,
          }).eq('id', conn.id);
          renewed++;
        }
        // Sync filet de sécurité (fire-and-forget).
        fetch(`${env('SUPABASE_URL')}/functions/v1/sync-calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON_SECRET },
          body: JSON.stringify({ connection_id: conn.id }),
        }).catch((e) => console.error('trigger sync-calendar:', e));
        synced++;
      } catch (e) {
        failed++;
        console.error(`renew connexion ${conn.id}:`, e);
        await sb.from('integration_connections').update({ status: 'error' }).eq('id', conn.id);
      }
    }

    return json({ ok: true, connections: conns?.length ?? 0, renewed, synced, failed });
  } catch (e) {
    console.error('calendar-watch-renew:', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});
