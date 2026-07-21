// Helpers partagés Google Calendar + gestion tokens.
// Réf : docs/spec-module-frais-attribution.md §4.1
//
// Décision tokens : Sapajoo n'utilise pas Supabase Vault. On réutilise le pattern
// bank_connections → RPC encrypt_credential / decrypt_credential (clé env). Les
// colonnes integration_connections.access_token_ref / refresh_token_ref stockent
// donc le token CHIFFRÉ (pas une ref Vault). cf. §2.3 du doc.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// Scopes lecture seule : événements agenda + carnet de contacts (People API).
// ⚠️ Ajouter les scopes contacts sur l'écran de consentement GCP, puis RECONNECTER
// l'agenda (prompt=consent) pour que le token couvre les nouveaux scopes.
export const GOOGLE_SCOPE = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/contacts.other.readonly',
].join(' ');

export const env = (k: string) => Deno.env.get(k) ?? '';

export function adminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
}

// Client "utilisateur" à partir du header Authorization, pour auth.getUser().
export function userClient(authHeader: string): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authHeader } },
  });
}

// ---- Chiffrement token (réutilise les RPC existantes bank_connections) ----
const ENC_KEY = () => env('BANK_CREDENTIALS_ENCRYPTION_KEY');

export async function encryptToken(sb: SupabaseClient, plain: string): Promise<string> {
  const { data, error } = await sb.rpc('encrypt_credential', {
    plain_text: plain, encryption_key: ENC_KEY(), iv: '',
  });
  if (error) throw new Error(`encrypt_credential: ${error.message}`);
  return data as string;
}

export async function decryptToken(sb: SupabaseClient, cipher: string): Promise<string> {
  // ⚠️ decrypt_credential(encrypted_text, encryption_key) : 2 args seulement
  // (contrairement à encrypt_credential qui prend un iv) — un 3e arg → 404 PostgREST.
  const { data, error } = await sb.rpc('decrypt_credential', {
    encrypted_text: cipher, encryption_key: ENC_KEY(),
  });
  if (error) throw new Error(`decrypt_credential: ${error.message}`);
  return data as string;
}

// Prolonge la vie d'une promesse au-delà de la réponse HTTP (fire-and-forget
// réel : sans waitUntil, le runtime tue le fetch dès que la function répond).
export function background(p: Promise<unknown>): void {
  const rt = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(p);
}

// ---- OAuth ----
export function buildAuthUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: env('GOOGLE_OAUTH_CLIENT_ID'),
    redirect_uri: env('GOOGLE_OAUTH_REDIRECT_URI'), // …/functions/v1/google-oauth-callback
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    access_type: 'offline',   // indispensable pour le refresh_token
    prompt: 'consent',        // idem, force le renvoi du refresh_token
    include_granted_scopes: 'true',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${p.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env('GOOGLE_OAUTH_CLIENT_ID'),
      client_secret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
      redirect_uri: env('GOOGLE_OAUTH_REDIRECT_URI'),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`token exchange ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env('GOOGLE_OAUTH_CLIENT_ID'),
      client_secret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`token refresh ${res.status}: ${await res.text()}`);
  return res.json();
}

// Renvoie un access_token valide pour une connexion, en rafraîchissant si besoin
// (< 5 min de marge, cf. §4.1). Met à jour la ligne integration_connections.
export async function getFreshAccessToken(
  sb: SupabaseClient,
  connection: Record<string, any>,
): Promise<string> {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  const soon = new Date(Date.now() + 5 * 60 * 1000);
  if (expiresAt && expiresAt > soon) {
    return decryptToken(sb, connection.access_token_ref);
  }
  const refresh = await decryptToken(sb, connection.refresh_token_ref);
  const t = await refreshAccessToken(refresh);
  const enc = await encryptToken(sb, t.access_token);
  await sb.from('integration_connections').update({
    access_token_ref: enc,
    token_expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    status: 'active',
  }).eq('id', connection.id);
  return t.access_token;
}

// ---- Calendar API ----
// Liste incrémentale : passe syncToken si présent, sinon fenêtre timeMin/timeMax.
export async function listEvents(accessToken: string, opts: {
  syncToken?: string | null;
  pageToken?: string;
  timeMin?: string;
  timeMax?: string;
}): Promise<any> {
  const p = new URLSearchParams({ singleEvents: 'true', maxResults: '250' });
  if (opts.pageToken) p.set('pageToken', opts.pageToken);
  if (opts.syncToken) {
    p.set('syncToken', opts.syncToken);
  } else {
    if (opts.timeMin) p.set('timeMin', opts.timeMin);
    if (opts.timeMax) p.set('timeMax', opts.timeMax);
    p.set('orderBy', 'startTime');
  }
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${p.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 410 Gone → syncToken expiré, le caller doit refaire un full resync.
  if (res.status === 410) return { __gone: true };
  if (!res.ok) throw new Error(`calendar list ${res.status}: ${await res.text()}`);
  return res.json();
}

// Enregistre un channel push. À renouveler avant watch_expires_at (~7 j).
export async function watchCalendar(accessToken: string, channelId: string): Promise<any> {
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events/watch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: channelId,
      type: 'web_hook',
      address: env('GOOGLE_CALENDAR_WEBHOOK_URL'), // …/functions/v1/google-calendar-webhook
    }),
  });
  if (!res.ok) throw new Error(`calendar watch ${res.status}: ${await res.text()}`);
  return res.json();
}

// Marque is_external : ≥1 participant dont le domaine ≠ domaine du tenant.
export function computeIsExternal(attendees: any[], tenantDomain: string | null): boolean {
  if (!Array.isArray(attendees) || attendees.length === 0) return false;
  if (!tenantDomain) return attendees.length > 0; // faute de mieux, cf. §3.3
  return attendees.some((a) => {
    const email: string = a?.email ?? '';
    const dom = email.split('@')[1]?.toLowerCase();
    return dom && dom !== tenantDomain.toLowerCase() && !a?.self;
  });
}
