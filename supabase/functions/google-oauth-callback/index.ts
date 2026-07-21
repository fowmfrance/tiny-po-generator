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
    const tokens = await exchangeCode(code);

    // access_type=offline + prompt=consent ⇒ refresh_token présent au 1er consentement.
    if (!tokens.refresh_token) {
      console.warn('Pas de refresh_token — consentement déjà donné ? forcer prompt=consent.');
    }

    const accessRef = await encryptToken(sb, tokens.access_token);
    const refreshRef = tokens.refresh_token ? await encryptToken(sb, tokens.refresh_token) : null;

    // TODO : récupérer l'email du calendar (userinfo) pour external_account_id.
    // ⚠️ PAS d'upsert onConflict ici : external_account_id est NULL et deux NULL
    // ne « entrent pas en conflit » en SQL → chaque reconnexion créerait une
    // ligne de plus (et le front, qui attend une connexion unique, casserait).
    // On met donc à jour la connexion existante (reconnexion pour élargir les
    // scopes = cas normal), sinon on insère.
    const payload = {
      access_token_ref: accessRef,
      // Google ne renvoie le refresh_token qu'au 1er consentement : ne jamais
      // écraser celui qu'on a par un null.
      ...(refreshRef ? { refresh_token_ref: refreshRef } : {}),
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      status: 'active',
    };

    const { data: existing } = await sb.from('integration_connections')
      .select('id')
      .eq('user_id', state)
      .eq('provider', 'google_calendar')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: conn, error } = existing
      ? await sb.from('integration_connections')
        .update(payload).eq('id', existing.id).select('id').single()
      : await sb.from('integration_connections')
        .insert({
          user_id: state,
          provider: 'google_calendar',
          external_account_id: null,
          ...payload,
          // organization_id rempli par trigger set_org_from_user
        }).select('id').single();

    if (error || !conn) {
      console.error('save integration_connections:', error);
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
