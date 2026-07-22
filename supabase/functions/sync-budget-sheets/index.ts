// sync-budget-sheets — contrôle de cohérence budget Sapajoo ↔ Google Sheet lié.
// Sapajoo est la SOURCE DE VÉRITÉ : on lit le Sheet, on compare, on ALERTE.
// Jamais de synchronisation silencieuse dans un sens ou dans l'autre.
//
// Convention côté Sheet (robuste aux remaniements de mise en page) :
//   - plage nommée SAPAJOO_TOTAL (obligatoire) : le total du budget.
//   - plage nommée SAPAJOO_CODE  (recommandée) : le code budget Sapajoo —
//     garde-fou anti « mauvais fichier lié » ET preuve de contrôle du fichier.
//
// Modes de liaison (budgets.sheet_mode) :
//   - service_account (v1) : le client partage son Sheet en LECTURE avec
//     l'email du compte de service (secrets GOOGLE_SA_EMAIL / GOOGLE_SA_KEY).
//     Aucun OAuth, le partage EST l'acte d'autorisation.
//   - oauth (à venir, clients SaaS) : « Se connecter avec Google » + sélecteur
//     de fichier, scope drive.file (accès limité aux fichiers choisis).
//
// verify_jwt = false : appelée par le front (JWT) ou par le cron (x-cron-secret).
// Corps : { budget_id? } — un budget précis, sinon tous les budgets liés.
import { corsHeaders, json, adminClient, userClient, env } from '../_shared/google.ts';

const CRON_SECRET = env('CRON_SECRET');
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

// ---- Auth service account : JWT RS256 signé avec la clé privée du SA ----
let cachedToken: { token: string; exp: number } | null = null;

function b64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function serviceAccountToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60e3) return cachedToken.token;
  const email = env('GOOGLE_SA_EMAIL');
  const rawKey = env('GOOGLE_SA_KEY');
  if (!email || !rawKey) throw new Error('Secrets GOOGLE_SA_EMAIL / GOOGLE_SA_KEY absents.');

  // La clé arrive soit en PEM direct, soit dans le JSON complet du SA.
  let pem = rawKey;
  if (rawKey.trim().startsWith('{')) {
    pem = JSON.parse(rawKey).private_key;
  }
  const der = Uint8Array.from(
    atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')),
    (c) => c.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );

  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600,
  }));
  const sig = new Uint8Array(await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`),
  ));
  const assertion = `${header}.${claims}.${b64url(sig)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Token SA: ${res.status} ${await res.text()}`);
  const out = await res.json();
  cachedToken = { token: out.access_token, exp: Date.now() + (out.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

// Lit une plage nommée ; null si la plage n'existe pas (400), throw sinon.
async function readNamedRange(token: string, spreadsheetId: string, range: string):
  Promise<{ value: unknown } | null> {
  const res = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (res.status === 400) return null; // plage nommée absente
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`${res.status}: ${body.slice(0, 200)}`);
    (err as any).status = res.status;
    throw err;
  }
  const out = await res.json();
  return { value: out.values?.[0]?.[0] ?? null };
}

// Nombre depuis une cellule : UNFORMATTED_VALUE renvoie un number si la cellule
// est numérique ; sinon on tolère « 45 000,00 € » saisi en texte.
function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/\s|€| /g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

interface CheckResult {
  budget_id: string;
  status: 'ok' | 'mismatch' | 'code_mismatch' | 'error';
  sheet_total?: number | null;
  detail?: string;
}

async function checkBudget(sb: any, b: any): Promise<CheckResult> {
  const patch: Record<string, unknown> = { sheet_checked_at: new Date().toISOString() };
  try {
    if (b.sheet_mode === 'oauth') {
      throw new Error('Mode OAuth pas encore disponible — utilisez le partage au compte de service.');
    }
    const token = await serviceAccountToken();

    const total = await readNamedRange(token, b.sheet_spreadsheet_id, 'SAPAJOO_TOTAL');
    if (!total) {
      throw new Error("Plage nommée SAPAJOO_TOTAL introuvable dans le Sheet (Données → Plages nommées).");
    }
    const sheetTotal = toNumber(total.value);
    if (sheetTotal == null) {
      throw new Error(`SAPAJOO_TOTAL ne contient pas un nombre (lu : ${JSON.stringify(total.value).slice(0, 60)}).`);
    }

    // Garde-fou « bon fichier » : code budget, si la plage existe.
    const code = await readNamedRange(token, b.sheet_spreadsheet_id, 'SAPAJOO_CODE');
    if (code && code.value != null && String(code.value).trim() !== '' &&
        String(code.value).trim().toLowerCase() !== String(b.code).trim().toLowerCase()) {
      patch.sheet_status = 'code_mismatch';
      patch.sheet_last_total = sheetTotal;
      patch.sheet_error = `SAPAJOO_CODE = « ${String(code.value).slice(0, 40)} », budget = « ${b.code} » : mauvais fichier ?`;
      await sb.from('budgets').update(patch).eq('id', b.id);
      return { budget_id: b.id, status: 'code_mismatch', sheet_total: sheetTotal };
    }

    const match = Math.abs(sheetTotal - Number(b.initial_amount)) <= 0.01;
    patch.sheet_status = match ? 'ok' : 'mismatch';
    patch.sheet_last_total = sheetTotal;
    patch.sheet_error = null;
    await sb.from('budgets').update(patch).eq('id', b.id);
    return { budget_id: b.id, status: match ? 'ok' : 'mismatch', sheet_total: sheetTotal };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = (e as any)?.status;
    patch.sheet_status = 'error';
    // 403 = fichier pas partagé avec le SA : l'erreur DOIT dire le geste à faire.
    patch.sheet_error = status === 403 || status === 404
      ? `Fichier inaccessible (${status}) : partagez le Sheet en lecture avec ${env('GOOGLE_SA_EMAIL') || 'le compte de service Sapajoo'}.`
      : msg.slice(0, 300);
    await sb.from('budgets').update(patch).eq('id', b.id);
    return { budget_id: b.id, status: 'error', detail: String(patch.sheet_error) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('authorization');
    const isCron = req.headers.get('x-cron-secret') === CRON_SECRET;
    if (!isCron) {
      if (!authHeader) return json({ error: 'Unauthorized' }, 401);
      const { data: { user } } = await userClient(authHeader).auth.getUser();
      if (!user) return json({ error: 'Unauthorized' }, 401);
    }

    const { budget_id } = await req.json().catch(() => ({}));
    const sb = adminClient();

    let q = sb.from('budgets')
      .select('id, code, initial_amount, sheet_spreadsheet_id, sheet_mode')
      .not('sheet_spreadsheet_id', 'is', null);
    if (budget_id) q = q.eq('id', budget_id);
    const { data: budgets, error } = await q.limit(200);
    if (error) throw error;
    if (!budgets?.length) return json({ ok: true, checked: 0, results: [] });

    const results: CheckResult[] = [];
    for (const b of budgets) results.push(await checkBudget(sb, b));

    return json({
      ok: true,
      checked: results.length,
      mismatches: results.filter((r) => r.status !== 'ok').length,
      results,
    });
  } catch (e) {
    console.error('sync-budget-sheets:', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});
