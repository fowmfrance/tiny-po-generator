// match-expense — scoring d'une dépense ↔ événement calendrier (§5).
// Déclenchée à l'insert/update d'un expense_event (webhook DB) ou à la demande.
// verify_jwt = false : appelée par trigger DB / cron avec CRON_SECRET, ou par le
// front avec JWT. Corps : { expense_id }.
import { corsHeaders, json, adminClient, env } from '../_shared/google.ts';

const CRON_SECRET = env('CRON_SECRET');

// Seuils (§5.2). auto_confirm off par défaut (opt-in tenant — décision Points ouverts).
const AUTO_CONFIRM = 85;
const SUGGEST_MIN = 50;

interface Signals {
  time: number; geo: number; category: number; attendees: number; history: number;
}

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Distance (minutes) entre un instant T et le créneau [start, end+30min].
function minutesToSlot(t: Date, start: Date, end: Date): number {
  const pad = new Date(end.getTime() + 30 * 60000);
  if (t >= start && t <= pad) return 0;
  return t < start
    ? (start.getTime() - t.getTime()) / 60000
    : (t.getTime() - pad.getTime()) / 60000;
}

function scoreEvent(exp: any, ev: any, historyHit: boolean): { total: number; signals: Signals } {
  const T = new Date(exp.occurred_at);
  const start = new Date(ev.starts_at), end = new Date(ev.ends_at);

  // 1. Proximité temporelle (40) : 40 × exp(−Δt/45)
  const dt = minutesToSlot(T, start, end);
  const time = 40 * Math.exp(-dt / 45);

  // 2. Proximité géographique (25) : <300 m plein, dégressif jusqu'à 2 km, 0 si pas de géoloc
  let geo = 0;
  if (exp.merchant_lat != null && ev.location_lat != null) {
    const d = haversineMeters(exp.merchant_lat, exp.merchant_lng, ev.location_lat, ev.location_lng);
    geo = d < 300 ? 25 : d > 2000 ? 0 : 25 * (1 - (d - 300) / 1700);
  }

  // 3. Cohérence catégorie/heure (15) : resto sur créneau repas chevauchant le RDV
  let category = 0;
  const h = T.getHours();
  const isMeal = (h >= 12 && h <= 14) || (h >= 19 && h <= 22);
  const cat = (exp.category_label ?? '').toLowerCase();
  if (cat.includes('restaurant') && isMeal && dt < 90) category = 15;
  else if (cat.includes('transport') || cat.includes('taxi') || cat.includes('vtc')) category = 8;

  // 4. Participants externes (10)
  const attendees = ev.is_external ? 10 : 0;

  // 5. Historique appris (10) : même marchand déjà confirmé pour ce compte
  const history = historyHit ? 10 : 0;

  const signals: Signals = { time: r(time), geo: r(geo), category, attendees, history };
  const total = r(time + geo + category + attendees + history);
  return { total, signals };
}
const r = (n: number) => Math.round(n * 100) / 100;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader && req.headers.get('x-cron-secret') !== CRON_SECRET) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const { expense_id } = await req.json();
    if (!expense_id) return json({ error: 'expense_id requis' }, 400);

    const sb = adminClient();
    const { data: exp } = await sb.from('expense_events')
      .select('*, expense_categories(name)').eq('id', expense_id).single();
    if (!exp) return json({ error: 'dépense introuvable' }, 404);
    exp.category_label = exp.expense_categories?.name ?? null;

    // Candidats : événements du même user dans [T−3h, T+1h] (§5.1)
    const T = new Date(exp.occurred_at).getTime();
    const { data: candidates } = await sb.from('calendar_events')
      .select('*')
      .eq('user_id', exp.user_id)
      .gte('starts_at', new Date(T - 3 * 3600e3).toISOString())
      .lte('starts_at', new Date(T + 1 * 3600e3).toISOString());

    if (!candidates?.length) {
      await sb.from('expense_events').update({ status: 'no_context' }).eq('id', expense_id);
      return json({ ok: true, status: 'no_context', best: null });
    }

    // Historique : marchand déjà confirmé ? (signal 5)
    let historyHit = false;
    if (exp.merchant_clean) {
      const { count } = await sb.from('expense_events')
        .select('id, expense_matches!inner(status)', { count: 'exact', head: true })
        .eq('merchant_clean', exp.merchant_clean)
        .neq('id', expense_id);
      historyHit = (count ?? 0) > 0;
    }

    let best: { ev: any; total: number; signals: Signals } | null = null;
    for (const ev of candidates) {
      const { total, signals } = scoreEvent(exp, ev, historyHit);
      if (!best || total > best.total) best = { ev, total, signals };
    }
    if (!best) return json({ ok: true, best: null });

    // TODO : lire le flag tenant auto_confirm avant d'appliquer AUTO_CONFIRM.
    const status = best.total >= AUTO_CONFIRM ? 'auto_confirmed'
      : best.total >= SUGGEST_MIN ? 'suggested' : null;

    if (!status) {
      await sb.from('expense_events').update({ status: 'no_context' }).eq('id', expense_id);
      return json({ ok: true, status: 'no_context', score: best.total });
    }

    await sb.from('expense_matches').upsert({
      expense_id,
      calendar_event_id: best.ev.id,
      confidence: best.total,
      signals: best.signals,
      status,
      // user_id / organization_id remplis par trigger set_match_owner
    }, { onConflict: 'expense_id' });

    await sb.from('expense_events')
      .update({ status: status === 'auto_confirmed' ? 'confirmed' : 'suggested' })
      .eq('id', expense_id);

    return json({ ok: true, status, score: best.total, signals: best.signals });
  } catch (e) {
    console.error('match-expense:', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});
