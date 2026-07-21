// google-oauth-start — démarre le flux OAuth Calendar (§4.1, étape 1).
// verify_jwt = true : appelé par le front authentifié. Un nonce anti-CSRF
// est stocké côté serveur (table oauth_nonces) et utilisé comme `state`.
import { corsHeaders, json, userClient, adminClient, buildAuthUrl } from '../_shared/google.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const { data: { user }, error } = await userClient(authHeader).auth.getUser();
    if (error || !user) return json({ error: 'Unauthorized' }, 401);

    // Nonce anti-CSRF stocké côté serveur (TTL 10 min via default sql).
    const nonce = crypto.randomUUID() + '-' + crypto.randomUUID();
    const sb = adminClient();
    const { error: nErr } = await sb.from('oauth_nonces').insert({
      nonce, user_id: user.id, provider: 'google_calendar',
    });
    if (nErr) return json({ error: 'nonce store failed' }, 500);
    return json({ url: buildAuthUrl(nonce) });
  } catch (e) {
    console.error('google-oauth-start:', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});

