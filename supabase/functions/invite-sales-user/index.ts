import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function response(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return response({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);
  const token = authHeader.slice(7);
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return response({ error: "Invalid session" }, 401);

  const { data: inviter } = await admin.from("sales_agents").select("role,is_active").eq("id", user.id).maybeSingle();
  if (!inviter?.is_active || !["admin", "manager"].includes(inviter.role)) return response({ error: "You do not have permission to invite users" }, 403);

  const payload = await request.json();
  const fullName = String(payload.fullName || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const phone = String(payload.phone || "").replace(/\D/g, "");
  const role = String(payload.role || "agent");
  const allowedRoles = inviter.role === "admin" ? ["manager", "agent", "viewer"] : ["agent", "viewer"];
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email)) return response({ error: "A valid name and email are required" }, 400);
  if (phone && !/^[6-9][0-9]{9}$/.test(phone)) return response({ error: "Enter a valid 10-digit mobile number" }, 400);
  if (!allowedRoles.includes(role)) return response({ error: "That role cannot be assigned" }, 403);

  const origin = request.headers.get("origin") || "https://onlindc.krishnatoshniwal94.workers.dev";
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, phone, role },
    redirectTo: `${origin}/admin/reset-password`
  });
  if (inviteError) return response({ error: inviteError.message }, 400);

  const invitedUser = invited.user;
  const agentCode = invitedUser.id.replaceAll("-", "").slice(0, 8).toUpperCase();
  const { error: profileError } = await admin.from("sales_agents").upsert({
    id: invitedUser.id, full_name: fullName, email, phone: phone || null,
    role, agent_code: agentCode, is_active: true, updated_at: new Date().toISOString()
  });
  if (profileError) return response({ error: profileError.message }, 500);

  return response({ user: { id: invitedUser.id, email, fullName, role, agentCode } });
});
