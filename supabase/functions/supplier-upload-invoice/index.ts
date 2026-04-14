import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const token = formData.get('token') as string;
    const purchaseOrderId = formData.get('purchase_order_id') as string;
    const invoiceNumber = formData.get('invoice_number') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const invoiceDate = formData.get('invoice_date') as string;
    const dueDate = formData.get('due_date') as string;
    const file = formData.get('file') as File | null;

    if (!token || !purchaseOrderId || !invoiceNumber || !amount || !invoiceDate || !dueDate) {
      return new Response(JSON.stringify({ error: 'Champs requis manquants' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate token
    const { data: accessToken, error: tokenError } = await supabase
      .from('supplier_access_tokens')
      .select('supplier_id, created_by')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (tokenError || !accessToken) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate PO belongs to this supplier
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, total_amount, supplier_id')
      .eq('id', purchaseOrderId)
      .eq('supplier_id', accessToken.supplier_id)
      .single();

    if (poError || !po) {
      return new Response(JSON.stringify({ error: 'Bon de commande introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check existing invoiced amount for this PO
    const { data: existingInvoices } = await supabase
      .from('supplier_invoices')
      .select('amount')
      .eq('purchase_order_id', purchaseOrderId)
      .neq('status', 'cancelled');

    const totalInvoiced = (existingInvoices || []).reduce((s, i) => s + Number(i.amount), 0);
    const remaining = Number(po.total_amount) - totalInvoiced;

    if (amount > remaining + 0.01) {
      return new Response(JSON.stringify({ 
        error: `Montant trop élevé. Restant facturable: ${remaining.toFixed(2)} €` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload file if provided
    let attachmentUrl: string | null = null;
    if (file) {
      const ext = file.name.split('.').pop() || 'pdf';
      const filePath = `${accessToken.created_by}/${accessToken.supplier_id}/${Date.now()}.${ext}`;
      
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('invoice-attachments')
        .upload(filePath, arrayBuffer, {
          contentType: file.type || 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
      } else {
        attachmentUrl = filePath;
      }
    }

    // Create invoice record
    const { data: invoice, error: insertError } = await supabase
      .from('supplier_invoices')
      .insert({
        user_id: accessToken.created_by,
        supplier_id: accessToken.supplier_id,
        purchase_order_id: purchaseOrderId,
        invoice_number: invoiceNumber,
        po_number: po.po_number,
        amount,
        currency: 'EUR',
        invoice_date: invoiceDate,
        received_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        status: 'pending',
        attachment_url: attachmentUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Impossible de créer la facture: ' + insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ invoice, percentInvoiced: ((totalInvoiced + amount) / Number(po.total_amount) * 100).toFixed(1) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('supplier-upload-invoice error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
