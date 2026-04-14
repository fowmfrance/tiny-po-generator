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
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: accessToken, error: accessTokenError } = await supabase
      .from('supplier_access_tokens')
      .select(`
        id,
        token,
        supplier_id,
        email_verified,
        supplier:suppliers (
          id,
          name,
          email,
          city,
          country,
          kyc_level_id,
          kyc_status
        )
      `)
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (accessTokenError || !accessToken?.supplier) {
      return new Response(JSON.stringify({ error: 'Lien invalide ou expiré' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: purchaseOrders, error: purchaseOrdersError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, total_amount, currency, status, created_at, expected_delivery_date')
      .eq('supplier_id', accessToken.supplier_id)
      .order('created_at', { ascending: false });

    if (purchaseOrdersError) {
      return new Response(JSON.stringify({ error: 'Impossible de charger les bons de commande' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        supplier: accessToken.supplier,
        purchaseOrders: purchaseOrders ?? [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('supplier-portal-data error:', error);

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
