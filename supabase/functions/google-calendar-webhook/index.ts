// google-calendar-webhook — réception des push Google (§4.1).
// verify_jwt = false : Google appelle sans JWT. Le payload NE contient PAS les
// données : on identifie la connexion via X-Goog-Channel-Id (= watch_channel_id)
// puis on déclenche une sync incrémentale.
import { corsHeaders, json, adminClient, env } from '../_shared/google.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const channelId = req.headers.get('x-goog-channel-id');
    const resourceState = req.headers.get('x-goog-resource-state'); // sync | exists | not_exists

    // Ping initial de vérification du channel : ne rien synchroniser.
    if (resourceState === 'sync') return new Response(null, { status: 200 });
    if (!channelId) return json({ error: 'channel manquant' }, 400);

    const sb = adminClient();
    // Anti-spoofing : le channel doit exister en base (§4.1).
    const { data: conn } = await sb.from('integration_connections')
      .select('id').eq('watch_channel_id', channelId).maybeSingle();
    if (!conn) return json({ error: 'channel inconnu' }, 404);

    // Déclenche la sync (fire-and-forget) via sync-calendar avec le secret cron.
    fetch(`${env('SUPABASE_URL')}/functions/v1/sync-calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': env('CRON_SECRET') },
      body: JSON.stringify({ connection_id: conn.id }),
    }).catch((e) => console.error('trigger sync-calendar:', e));

    return new Response(null, { status: 200 }); // Google attend un 2xx rapide
  } catch (e) {
    console.error('google-calendar-webhook:', e);
    return json({ error: 'Erreur serveur' }, 500);
  }
});
