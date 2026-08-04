import React, { useMemo, useState } from "react";
import { Copy, UserCheck, Users } from "lucide-react";
import { updateAgent } from "../services/agentService";

export default function TeamPage({ data, reload, notify }) {
  const [saving, setSaving] = useState("");
  const agents = data.salesAgents || [];
  const performance = useMemo(() => agents.map((agent) => {
    const leads = (data.crmLeads || []).filter((lead) => lead.assigned_agent_id === agent.id);
    const won = leads.filter((lead) => (lead.stage || lead.status) === "Won");
    const tasks = (data.crmTasks || []).filter((task) => task.assigned_agent_id === agent.id || leads.some((lead) => lead.id === task.lead_id));
    return { agent, leads: leads.length, won: won.length, completed: tasks.filter((task) => task.status === "Completed").length, overdue: tasks.filter((task) => task.status === "Pending" && new Date(task.due_at) < new Date()).length };
  }), [agents, data.crmLeads, data.crmTasks]);

  async function save(agent, values) {
    setSaving(agent.id);
    try { await updateAgent(agent.id, values); await reload(); notify("Agent updated."); }
    catch (error) { notify(error.message || "Could not update agent."); }
    finally { setSaving(""); }
  }

  return <><div className="pageHead"><div><span className="pageEyebrow">People and ownership</span><h1>Sales team</h1><p className="muted">Manage access, agent links, workload and performance.</p></div></div>
    <div className="teamSummary"><span><Users size={22}/><b>{agents.filter((agent) => agent.is_active).length}</b><small>Active users</small></span><span><UserCheck size={22}/><b>{(data.crmLeads || []).filter((lead) => lead.assigned_agent_id).length}</b><small>Assigned leads</small></span><span><b>{(data.crmLeads || []).filter((lead) => !lead.assigned_agent_id).length}</b><small>Unassigned leads</small></span></div>
    <section className="adminCard"><div className="crmSectionHead"><div><h2>Team directory</h2><p className="muted">Invite login users in Supabase, then manage their role here.</p></div></div><div className="agentGrid">{performance.map(({ agent, leads, won, completed, overdue }) => <article className="agentCard" key={agent.id}><header><div><b>{agent.full_name}</b><small>{agent.email}</small></div><label><input type="checkbox" checked={agent.is_active} onChange={(event) => save(agent,{is_active:event.target.checked})}/> Active</label></header><div className="agentControls"><select value={agent.role} disabled={saving === agent.id} onChange={(event) => save(agent,{role:event.target.value})}><option value="admin">Admin</option><option value="manager">Manager</option><option value="agent">Sales agent</option><option value="viewer">Viewer</option></select><button onClick={async()=>{await navigator.clipboard.writeText(`${window.location.origin}/?agent=${agent.agent_code}`);notify("Agent diagnostic link copied.");}}><Copy size={16}/>Copy link</button></div><div className="agentMetrics"><span><b>{leads}</b><small>Leads</small></span><span><b>{completed}</b><small>Follow-ups</small></span><span><b>{won}</b><small>Won</small></span><span className={overdue ? "dangerText" : ""}><b>{overdue}</b><small>Overdue</small></span></div></article>)}</div></section>
  </>;
}
