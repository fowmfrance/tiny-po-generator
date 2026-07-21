// enrich-contacts — enrichissement des contacts extraits des RDV (module Notes de frais).
// Lookup en 2 étages, par email :
//   1. Carnet de contacts du compte connecté : Google People API
//      (searchContacts = contacts enregistrés, otherContacts = contacts d'interaction).
//      Outlook/Microsoft Graph : à venir (même interface).
//   2. CRM tiers via connecteur générique — premier provider : Sellsy
//      (secrets SELLSY_CLIENT_ID / SELLSY_CLIENT_SECRET ; OAuth2 client_credentials).
// verify_jwt = false : appelée par sync-calendar (x-cron-secret) ou par le front (JWT).
// Corps : { user_id, limit? } — traite les te_contacts sans enriched_at.
// ⚠️ Nécessite les scopes contacts.readonly + contacts.other.readonly : ajouter les
// scopes sur l'écran de consentement GCP puis RECONNECTER l'agenda.
import { corsHeaders, json, adminClient, userClient, env, getFreshAccessToken } from '../_shared/google.ts';

const CRON_SECRET = env('CRON_SECRET');
const PEOPLE_API = 'https://people.googleapis.com/v1';

interface Enriched {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  crm_ref?: string | null;
  crm_provider?: string | null;
  enrich_source: 'google_contacts' | 'other_contacts' | 'crm' | 'none';
}

function fromPerson(p: any, source: Enriched['enrich_source']): Enriched {
  const name = p?.names?.[0];
  return {
    first_name: name?.givenName ?? null,
    last_name: name?.familyName ?? null,
    display_name: name?.displayName ?? null,
    company_name: p?.organizations?.[0]?.name ?? null,
    phone: p?.phoneNumbers?.[0]?.value ?? null,
    enrich_source: source,
  };
}

// People API : les endpoints search exigent un appel de "warmup" (query vide)
// avant la vraie requête (cache côté Google). cf. doc people:searchContacts.
async function peopleSearch(token: string, endpoint: 'people:searchContacts' | 'otherContacts:search',
  email: string, readMask: string): Promise<any | null> {
  const base = `${PEOPLE_API}/${endpoint}?readMask=${readMask}&pageSize=3`;
  await fetch(`${base}&query=`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  const res = await fetch(`${base}&query=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) return { __noScope: true }; // scopes contacts absents → reconnexion requise
  if (!res.ok) { console.error(`${endpoint} ${res.status}:`, await res.text()); return null; }
  const out = await res.json();
  const match = (out.results ?? []).find((r: any) =>
    (r.person?.emailAddresses ?? []).some((e: any) => (e.value ?? '').toLowerCase() === email));
  return match?.person ?? null;
}

// Recherche LIVE par nom dans le carnet Google (contacts enregistrés + contacts
// d'interaction) — pour le lookup « Qui participe » de la modale de vérification.
// Un invité peut être dans le carnet Gmail sans jamais avoir été dans un RDV
// synchronisé (donc absent de te_contacts).
async function searchPeople(token: string, q: string):
  Promise<{ results: { name: string; email: string | null; company: string | null; source: string }[]; noScope: boolean }> {
  const endpoints: { ep: string; mask: string; source: string }[] = [
    { ep: 'people:searchContacts', mask: 'names,emailAddresses,organizations', source: 'google_contacts' },
    { ep: 'otherContacts:search', mask: 'names,emailAddresses', source: 'other_contacts' },
  ];
  const results: { name: string; email: string | null; company: string | null; source: string }[] = [];
  let noScope = false;
  for (const { ep, mask, source } of endpoints) {
    const base = `${PEOPLE_API}/${ep}?readMask=${mask}&pageSize=6`;
    // Warmup obligatoire (cache Google), cf. peopleSearch.
    await fetch(`${base}&query=`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
    const res = await fetch(`${base}&query=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403) { noScope = true; continue; }
    if (!res.ok) { console.error(`${ep} search ${res.status}:`, await res.text()); continue; }
    const out = await res.json();
    for (const r of out.results ?? []) {
      const p = r.person;
      const email = (p?.emailAddresses?.[0]?.value ?? '').toLowerCase() || null;
      const name = p?.names?.[0]?.displayName ?? email;
      if (!name) continue;
      if (email && results.some((x) => x.email === email)) continue;
      results.push({ name, email, company: p?.organizations?.[0]?.name ?? null, source });
    }
  }
  return { results, noScope };
}

// ---- Connecteur CRM générique — provider Sellsy (v2) ----
// Interface : lookupCrm(email) → { crm_ref, crm_provider, company_name?, … } | null.
// D'autres providers (HubSpot, Pipedrive…) s'ajouteront derrière la même signature.
let sellsyToken: { token: string; exp: number } | null = null;

async function sellsyAccessToken(): Promise<string | null> {
  const id = env('SELLSY_CLIENT_ID'), secret = env('SELLSY_CLIENT_SECRET');
  if (!id || !secret) return null; // provider non configuré
  if (sellsyToken && sellsyToken.exp > Date.now() + 60e3) return sellsyToken.token;
  const res = await fetch('https://login.sellsy.com/oauth2/access-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
  });
  if (!res.ok) { console.error('sellsy token', res.status, await res.text()); return null; }
  const out = await res.json();
  sellsyToken = { token: out.access_token, exp: Date.now() + (out.expires_in ?? 3600) * 1000 };
  return sellsyToken.token;
}

async function lookupCrm(email: string): Promise<Partial<Enriched> | null> {
  const token = await sellsyAccessToken();
  if (!token) return null;
  const res = await fetch('https://api.sellsy.com/v2/contacts/search?limit=3', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters: { email } }),
  });
  if (!res.ok) { console.error('sellsy search', res.status, await res.text()); return null; }
  const out = await res.json();
  const c = (out.data ?? [])[0];
  if (!c) return null;
  return {
    crm_ref: String(c.id),
    crm_provider: 'sellsy',
    first_name: c.first_name ?? null,
    last_name: c.last_name ?? null,
    // TODO Sprint 3 : remonter l'entreprise liée (embed companies) → CAC par entreprise.
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader && req.headers.get('x-cron-secret') !== CRON_SECRET) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const { user_id, limit, search } = await req.json();

    const sb = adminClient();

    // ---- Mode recherche live (front, JWT obligatoire) : { search: "regis" } ----
    // L'utilisateur est résolu depuis le JWT (jamais depuis le corps).
    if (typeof search === 'string' && search.trim()) {
      if (!authHeader) return json({ error: 'Unauthorized' }, 401);
      const { data: { user } } = await userClient(authHeader).auth.getUser();
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const { data: sconn } = await sb.from('integration_connections')
        .select('*').eq('user_id', user.id).eq('provider', 'google_calendar')
        .eq('status', 'active').maybeSingle();
      const token = sconn ? await getFreshAccessToken(sb, sconn).catch(() => null) : null;
      if (!token) return json({ ok: true, results: [], needs_reauth: !sconn });
      const { results, noScope } = await searchPeople(token, search.trim());
      return json({ ok: true, results, needs_reauth: noScope });
    }

    if (!user_id) return json({ error: 'user_id requis' }, 400);
    const { data: conn } = await sb.from('integration_connections')
      .select('*').eq('user_id', user_id).eq('provider', 'google_calendar')
      .eq('status', 'active').maybeSingle();

    const { data: pending } = await sb.from('te_contacts')
      .select('id, email')
      .eq('user_id', user_id)
      .is('enriched_at', null)
      .limit(Math.min(50, Math.max(1, limit ?? 25)));

    let googleHits = 0, crmHits = 0, none = 0, needsReauth = false;
    const accessToken = conn ? await getFreshAccessToken(sb, conn).catch(() => null) : null;

    for (const c of pending ?? []) {
      let enriched: Enriched | null = null;

      // 1. Carnet du compte email (contacts enregistrés puis contacts d'interaction)
      if (accessToken && !needsReauth) {
        const saved = await peopleSearch(accessToken, 'people:searchContacts', c.email,
          'names,emailAddresses,organizations,phoneNumbers');
        if (saved?.__noScope) { needsReauth = true; }
        else if (saved) enriched = fromPerson(saved, 'google_contacts');
        if (!enriched && !needsReauth) {
          const other = await peopleSearch(accessToken, 'otherContacts:search', c.email,
            'names,emailAddresses');
          if (other?.__noScope) needsReauth = true;
          else if (other) enriched = fromPerson(other, 'other_contacts');
        }
      }

      // 2. CRM tiers (Sellsy si configuré) — complète ou remplace
      const crm = await lookupCrm(c.email);
      if (crm) {
        enriched = { ...(enriched ?? { enrich_source: 'crm' }), ...crm };
        if (enriched.enrich_source !== 'google_contacts' && enriched.enrich_source !== 'other_contacts') {
          enriched.enrich_source = 'crm';
        }
        crmHits++;
      } else if (enriched) {
        googleHits++;
      }

      const payload: Record<string, unknown> = enriched
        ? { ...enriched, enriched_at: new Date().toISOString() }
        : { enrich_source: 'none', enriched_at: new Date().toISOString() };
      if (!enriched) none++;

      // Ne pas écraser un nom déjà présent par du null.
      for (const k of ['first_name', 'last_name', 'display_name', 'company_name', 'phone']) {
        if (payload[k] == null) delete payload[k];
      }
      const { error: upErr } = await sb.from('te_contacts').update(payload).eq('id', c.id);
      if (upErr) console.error('update te_contacts:', upErr.message);
    }

    return json({
      ok: true,
      processed: pending?.length ?? 0,
      google: googleHits,
      crm: crmHits,
      none,
      needs_reauth: needsReauth, // true → reconnecter l'agenda pour accorder les scopes contacts
    });
  } catch (e) {
    console.error('enrich-contacts:', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});
