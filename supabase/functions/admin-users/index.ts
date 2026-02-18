import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // GET: List all users
    if (req.method === "GET" && action === "list") {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;

      // Get all profiles
      const { data: profiles } = await supabase.from("profiles").select("*");
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      // Get all roles
      const { data: roles } = await supabase.from("user_roles").select("*");
      const rolesMap = new Map<string, any[]>();
      roles?.forEach((r: any) => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r);
        rolesMap.set(r.user_id, existing);
      });

      const result = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: (profileMap.get(u.id) as any)?.full_name || null,
        phone: (profileMap.get(u.id) as any)?.phone || null,
        avatar_url: (profileMap.get(u.id) as any)?.avatar_url || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        is_banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
        roles: rolesMap.get(u.id)?.map((r: any) => ({ id: r.id, role: r.role, store_id: r.store_id })) || [],
      }));

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST actions
    if (req.method === "POST") {
      const body = await req.json();

      if (action === "create") {
        const { email, password, full_name } = body;
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password: password || "plazoo123",
          email_confirm: true,
          user_metadata: { full_name },
        });
        if (error) throw error;
        return new Response(JSON.stringify({ user: data.user }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "reset-password") {
        const { user_id } = body;
        const { error } = await supabase.auth.admin.updateUserById(user_id, {
          password: "plazoo123",
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "toggle-ban") {
        const { user_id, ban } = body;
        const update = ban
          ? { ban_duration: "876600h" }
          : { ban_duration: "none" };
        const { error } = await supabase.auth.admin.updateUserById(user_id, update);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "set-role") {
        const { user_id, role } = body;
        // Remove existing global roles (not store-specific)
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .is("store_id", null);

        // Insert new role
        if (role) {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id, role });
          if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "delete") {
        const { user_id } = body;
        const { error } = await supabase.auth.admin.deleteUser(user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Ação não encontrada" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
