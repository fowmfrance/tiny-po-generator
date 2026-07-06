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
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');

    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await authed.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Require admin-sapajoo
    const { data: roleRow } = await admin
      .from('user_roles').select('role').eq('user_id', userData.user.id).eq('role', 'admin-sapajoo').maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { email, full_name, organization_id, role } = body ?? {};
    if (!email || !organization_id) {
      return new Response(JSON.stringify({ error: 'email et organization_id requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const finalRole = role && ['user', 'manager', 'admin'].includes(role) ? role : 'admin';

    const origin = req.headers.get('origin') ?? 'https://sapajoo.fr';

    // Try invite first
    let userId: string | null = null;
    const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name ?? '', organization_id },
      redirectTo: `${origin}/auth`,
    });

    if (invErr) {
      // If already exists, look them up
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
      return new Response(JSON.stringify({ error: 'Impossible de créer/retrouver l\'utilisateur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ensure profile exists + link to organization
    await admin.from('profiles').upsert({
      id: userId,
      email,
      full_name: full_name ?? null,
      organization_id,
    }, { onConflict: 'id' });

    // Set role (remove non-sapajoo roles first)
    await admin.from('user_roles').delete().eq('user_id', userId).neq('role', 'admin-sapajoo');
    await admin.from('user_roles').insert({ user_id: userId, role: finalRole });

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
