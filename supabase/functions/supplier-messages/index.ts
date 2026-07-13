import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { token, action, body, purchaseOrderId } = await req.json();
    if (!token) return json({ error: 'Token manquant' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validation du token → fournisseur + org
    const { data: accessToken } = await supabase
      .from('supplier_access_tokens')
      .select('supplier_id, organization_id, supplier:suppliers(id, name, organization_id)')
      .eq('token', String(token).trim())
      .eq('is_active', true)
      .maybeSingle();

    if (!accessToken) return json({ error: 'Token invalide' }, 403);

    const supplierId = accessToken.supplier_id;
    const supplierName = (accessToken as any).supplier?.name || 'Fournisseur';
    const organizationId = accessToken.organization_id || (accessToken as any).supplier?.organization_id;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('supplier_messages')
        .select('id, sender_type, sender_name, body, created_at, purchase_order_id')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: true });
      return data || [];
    };

    if (action === 'list') {
      // Marque comme lus (côté fournisseur) les messages équipe/bot
      await supabase
        .from('supplier_messages')
        .update({ read_by_supplier_at: new Date().toISOString() })
        .eq('supplier_id', supplierId)
        .in('sender_type', ['internal', 'bot'])
        .is('read_by_supplier_at', null);
      return json({ messages: await fetchMessages() });
    }

    if (action === 'send') {
      const text = String(body || '').trim();
      if (!text) return json({ error: 'Message vide' }, 400);

      // 1) Message du fournisseur
      await supabase.from('supplier_messages').insert({
        organization_id: organizationId,
        supplier_id: supplierId,
        purchase_order_id: purchaseOrderId || null,
        sender_type: 'supplier',
        sender_name: supplierName,
        body: text,
      });

      // 2) Réponse du chatbot (best-effort) : répond au factuel, transmet sinon
      try {
        const apiKey = Deno.env.get('LOVABLE_API_KEY');
        if (apiKey) {
          const [{ data: pos }, { data: invoices }] = await Promise.all([
            supabase.from('purchase_orders')
              .select('po_number, total_amount, currency, status, expected_delivery_date, created_at')
              .eq('supplier_id', supplierId),
            supabase.from('supplier_invoices')
              .select('invoice_number, po_number, amount, currency, invoice_date, due_date, paid_date, status')
              .eq('supplier_id', supplierId),
          ]);

          const context = JSON.stringify({ fournisseur: supplierName, bons_de_commande: pos || [], factures: invoices || [] });
          const system = [
            "Tu es l'assistant du portail fournisseur de Sapajoo. Réponds en français, de façon concise et courtoise.",
            "Utilise UNIQUEMENT les données JSON fournies (bons de commande, factures, paiements) pour répondre aux questions factuelles :",
            "statut d'un BdC, montant facturé/restant, date d'échéance, si une facture est payée (paid_date non nul) ou en attente.",
            "Si la question demande une action humaine, une décision, une négociation, ou une information absente des données,",
            "réponds brièvement que tu as bien transmis la demande à l'équipe qui reviendra vers le fournisseur — n'invente jamais.",
            "Ne donne pas de conseils juridiques/fiscaux. Reste factuel.",
            `Données du fournisseur : ${context}`,
          ].join(' ');

          const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: system },
                { role: 'user', content: text },
              ],
              temperature: 0.2,
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const reply = aiData?.choices?.[0]?.message?.content?.trim();
            if (reply) {
              await supabase.from('supplier_messages').insert({
                organization_id: organizationId,
                supplier_id: supplierId,
                sender_type: 'bot',
                sender_name: 'Assistant',
                body: reply,
              });
            }
          }
        }
      } catch (e) {
        console.error('chatbot error (non bloquant):', e);
      }

      return json({ messages: await fetchMessages() });
    }

    return json({ error: 'Action inconnue' }, 400);
  } catch (e) {
    console.error('supplier-messages error:', e);
    return json({ error: 'Erreur serveur' }, 500);
  }
});
