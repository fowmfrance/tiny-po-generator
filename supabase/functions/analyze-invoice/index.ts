import { createClient } from 'npm:@supabase/supabase-js@2';
import { getDocument, GlobalWorkerOptions } from 'npm:pdfjs-dist@4.4.168/legacy/build/pdf.mjs';

// Disable worker for Deno edge runtime
GlobalWorkerOptions.workerSrc = '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'extract_invoice_data',
      description: 'Extract all structured data from a French invoice PDF text.',
      parameters: {
        type: 'object',
        properties: {
          emitter_name: { type: 'string', description: "Raison sociale / nom de l'émetteur de la facture" },
          emitter_siren: { type: 'string', description: "SIREN ou SIRET de l'émetteur (si trouvé)" },
          emitter_address: { type: 'string', description: "Adresse de l'émetteur" },
          emitter_iban: { type: 'string', description: "IBAN de l'émetteur (si présent sur la facture)" },
          emitter_bic: { type: 'string', description: "BIC/SWIFT de l'émetteur (si présent)" },
          emitter_bank_name: { type: 'string', description: "Nom de la banque de l'émetteur (si présent)" },
          invoice_number: { type: 'string', description: 'Numéro de la facture' },
          invoice_date: { type: 'string', description: 'Date de la facture (format YYYY-MM-DD)' },
          due_date: { type: 'string', description: "Date d'échéance (format YYYY-MM-DD, si présente)" },
          po_number: { type: 'string', description: 'Numéro de bon de commande référencé (si présent)' },
          amount_ht: { type: 'number', description: 'Montant total HT' },
          vat_rate: { type: 'number', description: 'Taux de TVA principal en % (ex: 20)' },
          vat_amount: { type: 'number', description: 'Montant de la TVA' },
          amount_ttc: { type: 'number', description: 'Montant total TTC' },
          currency: { type: 'string', description: 'Devise (EUR, USD, etc.)' },
          payment_terms: { type: 'string', description: 'Conditions de paiement mentionnées' },
          confidence: {
            type: 'object',
            description: 'Niveau de confiance pour chaque champ extrait (high/medium/low)',
            properties: {
              emitter_name: { type: 'string', enum: ['high', 'medium', 'low'] },
              amount_ht: { type: 'string', enum: ['high', 'medium', 'low'] },
              invoice_number: { type: 'string', enum: ['high', 'medium', 'low'] },
              iban: { type: 'string', enum: ['high', 'medium', 'low', 'not_found'] },
              po_number: { type: 'string', enum: ['high', 'medium', 'low', 'not_found'] },
            },
            required: ['emitter_name', 'amount_ht', 'invoice_number', 'iban', 'po_number'],
          },
        },
        required: [
          'emitter_name', 'invoice_number', 'invoice_date', 'amount_ht',
          'amount_ttc', 'currency', 'confidence',
        ],
        additionalProperties: false,
      },
    },
  },
];

/**
 * Extract text from all pages of a PDF using pdfjs-dist
 */
async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<string> {
  const loadingTask = getDocument({
    data: pdfBytes,
    useSystemFonts: true,
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .filter((item: any) => 'str' in item)
      .map((item: any) => item.str);
    pages.push(`--- Page ${i} ---\n${strings.join(' ')}`);
  }

  return pages.join('\n\n');
}

/**
 * Call AI to extract structured invoice data from text
 */
async function analyzeWithAI(pdfText: string, apiKey: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert comptable français spécialisé dans l'analyse de factures fournisseurs.
Extrais TOUTES les informations structurées du texte de facture fourni.
Sois particulièrement attentif à :
- Le RIB/IBAN de l'émetteur (souvent en bas de page ou en annexe)
- Le numéro de bon de commande référencé (souvent en en-tête ou dans les mentions)
- La distinction entre montant HT et TTC
- Le SIREN/SIRET de l'émetteur
Retourne les dates au format YYYY-MM-DD.
Si un champ n'est pas trouvé, retourne une chaîne vide ou null.`,
        },
        {
          role: 'user',
          content: `Voici le texte extrait d'une facture PDF. Analyse-le et extrais toutes les informations structurées.\n\n${pdfText}`,
        },
      ],
      tools: EXTRACTION_TOOLS,
      tool_choice: { type: 'function', function: { name: 'extract_invoice_data' } },
    }),
  });

  return response;
}

/**
 * Run conformity checks against database records
 */
async function runConformityChecks(
  extracted: any,
  token: string,
  purchaseOrderId: string,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Validate token
  const { data: accessToken } = await supabase
    .from('supplier_access_tokens')
    .select('supplier_id, created_by')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle();

  if (!accessToken) return null;

  // Fetch supplier, PO, bank accounts, and existing invoices in parallel
  const [supplierRes, poRes, bankRes, invoicesRes] = await Promise.all([
    supabase.from('suppliers').select('name, siren, email').eq('id', accessToken.supplier_id).single(),
    supabase.from('purchase_orders').select('po_number, total_amount, currency, supplier_name').eq('id', purchaseOrderId).single(),
    supabase.from('supplier_bank_accounts').select('encrypted_iban, encrypted_bic, bank_name, is_primary, is_archived').eq('supplier_id', accessToken.supplier_id).eq('is_archived', false),
    supabase.from('supplier_invoices').select('amount').eq('purchase_order_id', purchaseOrderId).neq('status', 'cancelled'),
  ]);

  const supplier = supplierRes.data;
  const po = poRes.data;
  const bankAccounts = bankRes.data;
  const totalInvoiced = (invoicesRes.data || []).reduce((s: number, i: any) => s + Number(i.amount), 0);

  const checks: Array<{ field: string; status: 'ok' | 'warning' | 'error'; expected: string; found: string; message: string }> = [];

  // Check emitter name
  if (supplier && extracted.emitter_name) {
    const nameMatch = supplier.name.toLowerCase().includes(extracted.emitter_name.toLowerCase()) ||
      extracted.emitter_name.toLowerCase().includes(supplier.name.toLowerCase());
    checks.push({
      field: 'emitter_name',
      status: nameMatch ? 'ok' : 'warning',
      expected: supplier.name,
      found: extracted.emitter_name,
      message: nameMatch ? 'Nom émetteur conforme' : 'Le nom émetteur ne correspond pas au fournisseur enregistré',
    });
  }

  // Check SIREN
  if (supplier?.siren && extracted.emitter_siren) {
    const sirenClean = (s: string) => s.replace(/\s/g, '');
    const sirenMatch = sirenClean(supplier.siren).startsWith(sirenClean(extracted.emitter_siren)) ||
      sirenClean(extracted.emitter_siren).startsWith(sirenClean(supplier.siren));
    checks.push({
      field: 'siren',
      status: sirenMatch ? 'ok' : 'error',
      expected: supplier.siren,
      found: extracted.emitter_siren,
      message: sirenMatch ? 'SIREN conforme' : 'SIREN ne correspond pas !',
    });
  }

  // Check PO number
  if (po && extracted.po_number) {
    const poMatch = extracted.po_number === po.po_number;
    checks.push({
      field: 'po_number',
      status: poMatch ? 'ok' : 'warning',
      expected: po.po_number,
      found: extracted.po_number,
      message: poMatch ? 'N° BdC conforme' : 'Le n° de BdC référencé ne correspond pas',
    });
  } else if (po && !extracted.po_number) {
    checks.push({
      field: 'po_number',
      status: 'warning',
      expected: po.po_number,
      found: '',
      message: 'Aucun n° de BdC détecté sur la facture',
    });
  }

  // Check amount vs PO
  if (po && extracted.amount_ht) {
    const remaining = Number(po.total_amount) - totalInvoiced;
    const amountOk = extracted.amount_ht <= remaining + 0.01;
    checks.push({
      field: 'amount_ht',
      status: amountOk ? 'ok' : 'error',
      expected: `≤ ${remaining.toFixed(2)} € (restant)`,
      found: `${extracted.amount_ht.toFixed(2)} €`,
      message: amountOk
        ? `Montant dans les limites (${((totalInvoiced + extracted.amount_ht) / Number(po.total_amount) * 100).toFixed(0)}% du BdC)`
        : `Montant dépasse le restant facturable de ${(extracted.amount_ht - remaining).toFixed(2)} €`,
    });
  }

  // Check IBAN
  if (extracted.emitter_iban && bankAccounts && bankAccounts.length > 0) {
    checks.push({
      field: 'iban',
      status: 'warning',
      expected: 'Vérification manuelle requise',
      found: extracted.emitter_iban,
      message: 'IBAN détecté sur la facture — à comparer avec le RIB enregistré',
    });
  } else if (!extracted.emitter_iban) {
    checks.push({
      field: 'iban',
      status: 'warning',
      expected: '-',
      found: '',
      message: 'Aucun IBAN détecté sur la facture',
    });
  }

  return { checks };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const token = formData.get('token') as string | null;
    const purchaseOrderId = formData.get('purchase_order_id') as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'Fichier requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI non configuré' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Extract text from PDF using pdfjs-dist
    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    let pdfText: string;
    try {
      pdfText = await extractTextFromPdf(pdfBytes);
    } catch (pdfError) {
      console.error('PDF text extraction failed:', pdfError);
      return new Response(JSON.stringify({ error: 'Impossible de lire le PDF. Vérifiez que le fichier n\'est pas corrompu.' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pdfText || pdfText.trim().length < 20) {
      return new Response(JSON.stringify({ error: 'Le PDF ne contient pas de texte exploitable (document scanné ?). L\'OCR n\'est pas encore supporté.' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Send extracted text to AI for structured extraction
    const aiResponse = await analyzeWithAI(pdfText, LOVABLE_API_KEY);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez dans quelques instants.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits AI épuisés.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: "Erreur d'analyse AI" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error('No tool call in AI response:', JSON.stringify(aiResult));
      return new Response(JSON.stringify({ error: "L'AI n'a pas pu extraire les données" }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Step 3: Optional conformity checks
    let conformity: Record<string, any> | null = null;
    if (token && purchaseOrderId) {
      conformity = await runConformityChecks(extracted, token, purchaseOrderId);
    }

    return new Response(JSON.stringify({ extracted, conformity }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('analyze-invoice error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
