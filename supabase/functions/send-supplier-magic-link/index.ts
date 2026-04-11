import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller } } = await supabase.auth.getUser(token)
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { supplier_id } = await req.json()
    if (!supplier_id) {
      return new Response(JSON.stringify({ error: 'supplier_id requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get supplier info
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, name, email')
      .eq('id', supplier_id)
      .single()

    if (supplierError || !supplier) {
      return new Response(JSON.stringify({ error: 'Fournisseur introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Deactivate existing tokens
    await supabase
      .from('supplier_access_tokens')
      .update({ is_active: false })
      .eq('supplier_id', supplier_id)
      .eq('is_active', true)

    // Create new token (email_verified = true since the link IS the verification)
    const { data: newToken, error: tokenError } = await supabase
      .from('supplier_access_tokens')
      .insert({
        supplier_id,
        created_by: caller.id,
        email_verified: true,
        verified_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (tokenError || !newToken) {
      return new Response(JSON.stringify({ error: 'Erreur création token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build portal URL
    const origin = req.headers.get('origin') || 'https://sapajoo.lovable.app'
    const portalUrl = `${origin}/supplier/portal/${newToken.token}`

    // Send magic link email via transactional email system
    const { error: emailError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'supplier-magic-link',
        recipientEmail: supplier.email,
        idempotencyKey: `supplier-magic-link-${newToken.id}`,
        templateData: {
          supplierName: supplier.name,
          portalUrl,
        },
      },
    })

    if (emailError) {
      console.error('Failed to send magic link email', emailError)
      // Token was created, so return success with a warning
    }

    return new Response(
      JSON.stringify({
        success: true,
        portalUrl,
        emailSent: !emailError,
        token: newToken.token,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-supplier-magic-link error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
