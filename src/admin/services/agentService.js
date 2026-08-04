import { supabase } from "../../services/supabase";

export async function loadCurrentAgent() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("sales_agents").select("*, sales_teams(name)").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateAgent(agentId, values) {
  const { data, error } = await supabase.from("sales_agents").update({ ...values, updated_at: new Date().toISOString() }).eq("id", agentId).select("*, sales_teams(name)").single();
  if (error) throw error;
  return data;
}

export async function assignLead({ leadId, fromAgentId, toAgentId, reason }) {
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const { error } = await supabase.from("crm_leads").update({ assigned_agent_id: toAgentId || null, assigned_at: toAgentId ? now : null, updated_at: now }).eq("id", leadId);
  if (error) throw error;
  const { error: historyError } = await supabase.from("lead_assignments").insert({ lead_id: leadId, from_agent_id: fromAgentId || null, to_agent_id: toAgentId || null, assigned_by: user?.id || null, reason: reason || "Assigned from CRM" });
  if (historyError) throw historyError;
  await supabase.from("crm_followup_tasks").update({ assigned_agent_id: toAgentId || null, updated_at: now }).eq("lead_id", leadId).eq("status", "Pending");
}
