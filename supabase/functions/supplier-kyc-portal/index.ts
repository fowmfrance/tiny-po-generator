import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json();
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const action = body?.action as string | undefined;
    if (!token) return json({ error: 'Token requis' }, 400);

    // Validate token
    const { data: accessToken } = await supabase
      .from('supplier_access_tokens')
      .select('id, supplier_id, is_active, supplier:suppliers(id, kyc_level_id, organization_id)')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (!accessToken?.supplier) return json({ error: 'Lien invalide' }, 404);
    const supplier = accessToken.supplier as any;
    const supplierId = supplier.id as string;
    const organizationId = supplier.organization_id as string;

    if (action === 'get') {
      if (!supplier.kyc_level_id) {
        return json({ kycLevelId: null, requirements: [], documents: [] });
      }
      const [{ data: requirements }, { data: documents }] = await Promise.all([
        supabase
          .from('kyc_level_requirements')
          .select('*, document_type:kyc_document_types(*)')
          .eq('kyc_level_id', supplier.kyc_level_id),
        supabase
          .from('supplier_kyc_documents')
          .select('*, document_type:kyc_document_types(name)')
          .eq('supplier_id', supplierId),
      ]);
      return json({
        kycLevelId: supplier.kyc_level_id,
        requirements: requirements ?? [],
        documents: documents ?? [],
      });
    }

    if (action === 'upload') {
      const documentTypeId = body?.documentTypeId as string;
      const fileBase64 = body?.fileBase64 as string;
      const fileName = body?.fileName as string;
      const contentType = (body?.contentType as string) || 'application/octet-stream';
      if (!documentTypeId || !fileBase64 || !fileName) {
        return json({ error: 'Paramètres manquants' }, 400);
      }

      const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
      if (bytes.byteLength > 10 * 1024 * 1024) {
        return json({ error: 'Fichier trop volumineux' }, 400);
      }
      const ext = fileName.split('.').pop() || 'bin';
      const path = `${supplierId}/${documentTypeId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(path, bytes, { contentType, upsert: true });
      if (uploadError) return json({ error: uploadError.message }, 500);

      const { data: inserted, error: insertError } = await supabase
        .from('supplier_kyc_documents')
        .insert({
          supplier_id: supplierId,
          document_type_id: documentTypeId,
          file_url: path,
          status: 'pending',
          organization_id: organizationId,
        })
        .select()
        .single();
      if (insertError) return json({ error: insertError.message }, 500);
      return json({ document: inserted });
    }

    return json({ error: 'Action inconnue' }, 400);
  } catch (err) {
    console.error('supplier-kyc-portal error:', err);
    return json({ error: err instanceof Error ? err.message : 'Erreur' }, 500);
  }
});
