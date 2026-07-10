// google-oauth-start — démarre le flux OAuth Calendar (§4.1, étape 1).
// verify_jwt = true : appelé par le front authentifié. On encode l'user_id dans
// le `state` (signé côté callback via la table) pour rattacher la connexion.
import { corsHeaders, json, userClient, buildAuthUrl } from '../_shared/google.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const { data: { user }, error } = await userClient(authHeader).auth.getUser();
    if (error || !user) return json({ error: 'Unauthorized' }, 401);

    // state = user_id (le callback recrée la connexion pour cet utilisateur).
    // TODO durcir : ajouter un nonce anti-CSRF stocké côté serveur + TTL.
    const state = user.id;
    return json({ url: buildAuthUrl(state) });
  } catch (e) {
    console.error('google-oauth-start:', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});
