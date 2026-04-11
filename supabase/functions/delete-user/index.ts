import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin-sapajoo
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin-sapajoo")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent deleting yourself
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: "Impossible de supprimer votre propre compte" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's profile to find their organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    // Find the admin of the same organization to reassign records
    let reassignToId: string | null = null;
    if (profile?.organization_id) {
      // Find another user in the same org with 'admin' role
      const { data: orgAdmins } = await supabase
        .from("profiles")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .neq("id", userId);

      if (orgAdmins && orgAdmins.length > 0) {
        // Prefer someone with admin role
        for (const candidate of orgAdmins) {
          const { data: adminRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", candidate.id)
            .eq("role", "admin")
            .maybeSingle();
          if (adminRole) {
            reassignToId = candidate.id;
            break;
          }
        }
        // Fallback: first user in org
        if (!reassignToId) {
          reassignToId = orgAdmins[0].id;
        }
      }
    }

    // Tables with user_id to reassign (excluding user_roles and profiles)
    const tablesToReassign = [
      "article_types", "bank_connections", "bank_label_mappings",
      "budget_types", "budgets", "expense_categories", "payment_batches",
      "purchase_orders", "supplier_agreements", "supplier_invoices",
      "supplier_ratings", "supplier_types", "suppliers", "teams", "transactions",
    ];

    if (reassignToId) {
      // Reassign all records to the org admin
      for (const table of tablesToReassign) {
        await supabase.from(table).update({ user_id: reassignToId }).eq("user_id", userId);
      }
    } else {
      // No one to reassign to — records will be orphaned (kept but user_id stays)
    }

    // Delete user_roles
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Delete profile
    await supabase.from("profiles").delete().eq("id", userId);

    // Delete from auth.users using admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, reassignedTo: reassignToId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
