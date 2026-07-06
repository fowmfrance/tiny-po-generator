import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { email, full_name, organization_id, role } = await req.json();
    if (!email || !organization_id) {
      return new Response(JSON.stringify({ error: 'email et organization_id requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const finalRole = role && ['user', 'manager', 'admin'].includes(role) ? role : 'admin';
    const origin = req.headers.get('origin') ?? 'https://sapajoo.fr';

    let userId: string | null = null;
    const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name ?? '', organization_id },
      redirectTo: `${origin}/auth`,
    });
    if (invErr) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === String(email).toLowerCase());
      if (!existing) {
        return new Response(JSON.stringify({ error: invErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = existing.id;
    } else {
      userId = invited.user?.id ?? null;
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: 'no user' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await admin.from('profiles').upsert({ id: userId, email, full_name: full_name ?? null, organization_id }, { onConflict: 'id' });
    await admin.from('user_roles').delete().eq('user_id', userId).neq('role', 'admin-sapajoo');
    await admin.from('user_roles').insert({ user_id: userId, role: finalRole });

    return new Response(JSON.stringify({ success: true, user_id: userId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
