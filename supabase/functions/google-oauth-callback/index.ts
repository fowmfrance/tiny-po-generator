// google-oauth-callback — échange code → tokens, crée la connexion (§4.1, étape 2).
// verify_jwt = false : Google redirige le navigateur ici sans JWT Supabase.
// L'identité vient du `state` (user_id) posé par google-oauth-start.
import { corsHeaders, adminClient, exchangeCode, encryptToken, watchCalendar, env, background } from '../_shared/google.ts';

const APP_URL = Deno.env.get('APP_URL') ?? '/';

function redirect(path: string) {
  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: `${APP_URL}${path}` } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // = user_id
    const oauthError = url.searchParams.get('error');

    if (oauthError) return redirect(`/frais?connexion=refusee`);
    if (!code || !state) return redirect(`/frais?connexion=erreur`);

    const sb = adminClient();

    // Vérifie le nonce anti-CSRF et le consomme.
    const { data: nonceRow } = await sb.from('oauth_nonces')
      .select('user_id, expires_at').eq('nonce', state).maybeSingle();
    if (!nonceRow || new Date(nonceRow.expires_at) < new Date()) {
      return redirect(`/frais?connexion=erreur`);
    }
    await sb.from('oauth_nonces').delete().eq('nonce', state);
    const userId = nonceRow.user_id as string;

    const tokens = await exchangeCode(code);

    // access_type=offline + prompt=consent ⇒ refresh_token présent au 1er consentement.
    if (!tokens.refresh_token) {
      console.warn('Pas de refresh_token — consentement déjà donné ? forcer prompt=consent.');
    }

    const accessRef = await encryptToken(sb, tokens.access_token);
    const refreshRef = tokens.refresh_token ? await encryptToken(sb, tokens.refresh_token) : null;

    // TODO : récupérer l'email du calendar (userinfo) pour external_account_id.
    const { data: conn, error } = await sb.from('integration_connections').upsert({
      user_id: state,
      provider: 'google_calendar',
      external_account_id: null,
      access_token_ref: accessRef,
      refresh_token_ref: refreshRef,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      status: 'active',
      // organization_id rempli par trigger set_org_from_user
    }, { onConflict: 'organization_id,user_id,provider,external_account_id' })
      .select('id').single();

    if (error || !conn) {
      console.error('upsert integration_connections:', error);
      return redirect(`/frais?connexion=erreur`);
    }

    // Enregistre le channel push (non bloquant : la sync + le cron quotidien
    // calendar-watch-renew rattrapent un échec ici).
    try {
      const watch = await watchCalendar(tokens.access_token, crypto.randomUUID());
      await sb.from('integration_connections').update({
        watch_channel_id: watch.id,
        watch_resource_id: watch.resourceId ?? null,
        watch_expires_at: watch.expiration ? new Date(Number(watch.expiration)).toISOString() : null,
      }).eq('id', conn.id);
    } catch (e) {
      console.error('watchCalendar (non bloquant):', e);
    }

    // Première sync en tâche de fond (fire-and-forget).
    background(fetch(`${env('SUPABASE_URL')}/functions/v1/sync-calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': env('CRON_SECRET') },
      body: JSON.stringify({ connection_id: conn.id }),
    }).catch((e) => console.error('trigger sync-calendar:', e)));

    return redirect(`/frais?connexion=ok`);
  } catch (e) {
    console.error('google-oauth-callback:', e);
    return redirect(`/frais?connexion=erreur`);
  }
});
