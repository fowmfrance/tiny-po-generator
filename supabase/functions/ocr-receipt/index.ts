// ocr-receipt — OCR d'un reçu photo (canal perso du module Notes de frais) → frais (§4.5).
// Fork du pipeline analyze-invoice, mais VISION (photo, pas PDF texte) : on envoie
// l'image au gateway Lovable (google/gemini-2.5-flash) en multimodal.
// ⚠️ Reçus/tickets du module Frais (bucket te-receipts) — PAS les factures
// fournisseurs (analyze-invoice / invoice-attachments).
// verify_jwt = false : appelée après upload (front avec JWT, ou trigger storage).
// Corps : { receipt_id }  (la ligne te_receipts existe déjà, statut ocr pending).
import { corsHeaders, json, adminClient, userClient, env, background } from '../_shared/google.ts';

const OCR_TOOL = [{
  type: 'function' as const,
  function: {
    name: 'extract_receipt',
    description: "Extraire les données d'un reçu / ticket de caisse français.",
    parameters: {
      type: 'object',
      properties: {
        merchant: { type: 'string', description: 'Nom du commerçant / enseigne' },
        amount: { type: 'number', description: 'Montant total TTC payé' },
        vat: { type: 'number', description: 'Montant de TVA (si présent)' },
        date: { type: 'string', description: 'Date du reçu au format YYYY-MM-DD' },
        time: { type: 'string', description: "Heure du paiement au format HH:MM (24 h) si visible sur le ticket" },
        category: {
          type: 'string',
          enum: ['restaurant', 'transport', 'hebergement', 'autre'],
          description: 'Type de frais déduit du reçu',
        },
      },
      required: ['merchant', 'amount', 'date'],
      additionalProperties: false,
    },
  },
}];

async function ocrImage(dataUrl: string, apiKey: string) {
  return fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: "Tu lis des reçus/tickets de caisse français. Extrais commerçant, montant TTC, TVA, date, heure et type de frais (restaurant, transport, hebergement, autre). Date au format YYYY-MM-DD, heure au format HH:MM (24 h) si imprimée. Si un champ est absent, ne l'invente pas." },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Voici la photo d\'un reçu. Extrais les données structurées.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: OCR_TOOL,
      tool_choice: { type: 'function', function: { name: 'extract_receipt' } },
    }),
  });
}

// Construit l'instant UTC d'une date+heure exprimée en heure de Paris (CET/CEST).
function parisISO(date: string, time: string): string {
  for (const off of ['+02:00', '+01:00']) {
    const d = new Date(`${date}T${time}:00${off}`);
    const local = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(d);
    if (local === time) return d.toISOString();
  }
  return new Date(`${date}T${time}:00+01:00`).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const { data: { user } } = await userClient(authHeader).auth.getUser();
      if (!user) return json({ error: 'Unauthorized' }, 401);
    }
    const apiKey = env('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'AI non configuré' }, 500);

    const { receipt_id } = await req.json();
    if (!receipt_id) return json({ error: 'receipt_id requis' }, 400);

    const sb = adminClient();
    const { data: receipt, error } = await sb.from('te_receipts').select('*').eq('id', receipt_id).single();
    if (error || !receipt) return json({ error: 'reçu introuvable' }, 404);

    // Télécharge l'image depuis le bucket privé.
    const { data: file, error: dlErr } = await sb.storage.from('te-receipts').download(
      receipt.storage_path.replace(/^te-receipts\//, ''),
    );
    if (dlErr || !file) throw new Error(`download reçu: ${dlErr?.message}`);

    const bytes = new Uint8Array(await file.arrayBuffer());
    // Encodage base64 par chunks (spread explose la pile sur une grosse image).
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    const b64 = btoa(bin);
    const mime = file.type || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${b64}`;

    const res = await ocrImage(dataUrl, apiKey);
    if (!res.ok) {
      await sb.from('te_receipts').update({ ocr_status: 'failed' }).eq('id', receipt_id);
      if (res.status === 429) return json({ error: 'Limite de requêtes atteinte.' }, 429);
      if (res.status === 402) return json({ error: 'Crédits AI épuisés.' }, 402);
      return json({ error: "Erreur d'analyse OCR" }, 500);
    }

    const out = await res.json();
    const args = out.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      await sb.from('te_receipts').update({ ocr_status: 'failed' }).eq('id', receipt_id);
      return json({ error: "L'AI n'a pas pu lire le reçu" }, 422);
    }
    const ex = JSON.parse(args);

    await sb.from('te_receipts').update({
      ocr_status: 'done',
      ocr_merchant: ex.merchant ?? null,
      ocr_amount: ex.amount ?? null,
      ocr_vat: ex.vat ?? null,
      ocr_date: ex.date ?? null,
      ocr_raw: ex,
    }).eq('id', receipt_id);

    // Crée le frais perso (source=receipt_only, reimbursable=true).
    const validCat = ['restaurant', 'transport', 'hebergement', 'autre'];
    const { data: expense, error: expErr } = await sb.from('te_expenses').insert({
      user_id: receipt.user_id,
      source: 'receipt_only',
      merchant_raw: ex.merchant ?? null,
      merchant_clean: ex.merchant ?? null,
      amount: ex.amount ?? 0,
      vat_amount: ex.vat ?? null,
      // Heure imprimée sur le ticket → matching précis (±3 h) ; sinon minuit UTC
      // pile = marqueur « date seule » que match-expense élargit à la journée.
      occurred_at: ex.date
        ? (ex.time && /^([01]\d|2[0-3]):[0-5]\d$/.test(ex.time)
            ? parisISO(ex.date, ex.time)
            : new Date(ex.date).toISOString())
        : new Date().toISOString(),
      te_category: validCat.includes(ex.category) ? ex.category : null,
      reimbursable: true,
      reimbursement_status: 'pending',
      receipt_id,
      status: 'new',
      // organization_id rempli par trigger
    }).select('id').single();
    if (expErr) throw new Error(`création frais: ${expErr.message}`);

    // Déclenche le matching sur le nouveau frais.
    background(fetch(`${env('SUPABASE_URL')}/functions/v1/match-expense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': env('CRON_SECRET') },
      body: JSON.stringify({ expense_id: expense.id }),
    }).catch((e) => console.error('trigger match-expense:', e)));

    return json({ ok: true, receipt_id, expense_id: expense.id, extracted: ex });
  } catch (e) {
    console.error('ocr-receipt:', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});
