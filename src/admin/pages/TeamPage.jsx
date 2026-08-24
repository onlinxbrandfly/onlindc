import React, { useMemo, useState } from "react";
import { Plus, UserCheck, Users } from "lucide-react";
import { updateAgent } from "../services/agentService";
import FormLinksPanel from "../components/FormLinksPanel";
import UserInviteModal from "../components/UserInviteModal";
import UserProfileModal from "../components/UserProfileModal";

export default function TeamPage({ data, reload, notify, currentAgent }) {
  const [saving, setSaving] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
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

  const selectedPerformance = selectedProfile ? performance.find((item) => item.agent.id === selectedProfile.agent.id) : null;

  return <><div className="pageHead"><div><span className="pageEyebrow">People and ownership</span><h1>Sales team</h1><p className="muted">Manage access, form links, profiles, workload and performance.</p></div><button className="btn primary iconTextButton" onClick={() => setShowInvite(true)}><Plus size={18} />Add user</button></div>
    <div className="teamSummary"><span><Users size={22}/><b>{agents.filter((agent) => agent.is_active).length}</b><small>Active users</small></span><span><UserCheck size={22}/><b>{(data.crmLeads || []).filter((lead) => lead.assigned_agent_id).length}</b><small>Assigned leads</small></span><span><b>{(data.crmLeads || []).filter((lead) => !lead.assigned_agent_id).length}</b><small>Unassigned leads</small></span></div>
    <FormLinksPanel notify={notify} />
    <section className="adminCard"><div className="crmSectionHead"><div><h2>Team directory</h2><p className="muted">Open a user to manage their profile, links and performance.</p></div></div><div className="agentGrid">{performance.map(({ agent, leads, won, completed, overdue }) => <article className="agentCard agentProfileCard" key={agent.id} onClick={() => setSelectedProfile({ agent, leads, won, completed, overdue })}><header><span className="agentAvatar">{(agent.full_name || "U").slice(0,1).toUpperCase()}</span><div><b>{agent.full_name}</b><small>{agent.email}</small></div><em className={agent.is_active ? "active" : ""}>{agent.is_active ? "Active" : "Inactive"}</em></header><div className="agentRole">{agent.role === "agent" ? "Sales agent" : agent.role}</div><div className="agentMetrics"><span><b>{leads}</b><small>Leads</small></span><span><b>{completed}</b><small>Follow-ups</small></span><span><b>{won}</b><small>Won</small></span><span className={overdue ? "dangerText" : ""}><b>{overdue}</b><small>Overdue</small></span></div><button type="button">View profile</button></article>)}</div></section>
    {showInvite && <UserInviteModal currentAgent={currentAgent} onClose={() => setShowInvite(false)} onInvited={reload} notify={notify} />}
    {selectedPerformance && <UserProfileModal profile={selectedPerformance} currentAgent={currentAgent} notify={notify} onClose={() => setSelectedProfile(null)} onSave={async (agent, values) => { await save(agent, values); setSelectedProfile({ ...selectedPerformance, agent: { ...agent, ...values } }); }} />}
  </>;
}
