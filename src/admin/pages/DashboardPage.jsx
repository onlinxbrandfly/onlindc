import React from "react";
import { ArrowRight, CalendarClock, CircleAlert, Plus, Trophy, Users } from "lucide-react";
import { leadContact } from "../services/crmService";

export default function DashboardPage({ data, onNavigate, currentAgent }) {
  const leads = data.crmLeads || [];
  const pendingTasks = (data.crmTasks || []).filter((task) => task.status === "Pending");
  const nextByLead = new Map();
  pendingTasks.sort((a, b) => new Date(a.due_at) - new Date(b.due_at)).forEach((task) => {
    if (!nextByLead.has(task.lead_id)) nextByLead.set(task.lead_id, task);
  });
  const nextTasks = [...nextByLead.values()];
  const overdue = nextTasks.filter((task) => new Date(task.due_at) < new Date());
  const unassigned = leads.filter((lead) => !lead.assigned_agent_id && !["Won", "Lost"].includes(lead.stage || lead.status));
  const demos = leads.filter((lead) => (lead.stage || lead.status) === "Demo Scheduled");
  const won = leads.filter((lead) => (lead.stage || lead.status) === "Won");
  const active = leads.filter((lead) => !["Won", "Lost"].includes(lead.stage || lead.status));
  const conversion = leads.length ? Math.round((won.length / leads.length) * 100) : 0;
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const canManage = ["admin", "manager"].includes(currentAgent?.role);
  const sourceStats = Object.entries(leads.reduce((result, lead) => {
    const source = lead.source || "Unknown";
    result[source] = result[source] || { leads: 0, won: 0 };
    result[source].leads += 1;
    if ((lead.stage || lead.status) === "Won") result[source].won += 1;
    return result;
  }, {})).sort((a, b) => b[1].leads - a[1].leads).slice(0, 6);
  const agentStats = (data.salesAgents || []).map((agent) => {
    const assigned = leads.filter((lead) => lead.assigned_agent_id === agent.id);
    return { agent, leads: assigned.length, won: assigned.filter((lead) => (lead.stage || lead.status) === "Won").length };
  }).sort((a, b) => b.won - a.won || b.leads - a.leads).slice(0, 6);

  return <>
    <div className="crmDashboardHero"><div className="pageHead appHomeHead"><div><span className="pageEyebrow">Sales command centre</span><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}{currentAgent?.full_name ? `, ${currentAgent.full_name.split(" ")[0]}` : ""}</h1><p>Here is what needs your attention today.</p></div><button className="btn crmHeroAdd iconTextButton" onClick={() => onNavigate("crm")}><Plus size={19}/>Add lead</button></div><div className="crmHeroProgress"><div><span><b>{active.length}</b> active opportunities</span><strong>{conversion}% conversion</strong></div><div><i style={{ width: `${conversion}%` }} /></div></div></div>

    <section className="homeActionGrid">
      <button className="homeActionCard urgent" onClick={() => onNavigate("crm")}><span><CircleAlert size={22}/></span><div><b>{overdue.length}</b><strong>Needs attention</strong><small>Handle these first</small></div><ArrowRight size={20}/></button>
      <button className="homeActionCard" onClick={() => onNavigate("crm")}><span><Users size={22}/></span><div><b>{unassigned.length}</b><strong>Unassigned leads</strong><small>Give every lead an owner</small></div><ArrowRight size={20}/></button>
      <button className="homeActionCard" onClick={() => onNavigate("crm")}><span><CalendarClock size={22}/></span><div><b>{demos.length}</b><strong>Demos</strong><small>Scheduled opportunities</small></div><ArrowRight size={20}/></button>
      <button className="homeActionCard" onClick={() => onNavigate("crm")}><span><Trophy size={22}/></span><div><b>{won.length}</b><strong>Won</strong><small>Converted opportunities</small></div><ArrowRight size={20}/></button>
    </section>

    <div className="homeColumns">
      <section className="adminCard homeFocusList"><div className="crmSectionHead"><div><h2>Start here</h2><p className="muted">The first five follow-ups in your queue.</p></div><button onClick={() => onNavigate("crm")}>View all</button></div>
        {nextTasks.slice(0, 5).map((task) => { const lead = leadById.get(task.lead_id); const contact = leadContact(lead); return <button className="homeFocusRow" key={task.id} onClick={() => onNavigate("crm")}><span>{contact.businessName.slice(0, 1).toUpperCase()}</span><div><b>{contact.businessName}</b><small>{task.title} · {new Date(task.due_at).toLocaleDateString()}</small></div><ArrowRight size={18}/></button>; })}
        {!nextTasks.length && <div className="emptyState">Your follow-up queue is clear.</div>}
      </section>
      <section className="adminCard homeScoreCard"><span><Trophy size={24}/></span><b>{won.length}</b><h2>Won opportunities</h2><p>Keep lead stages updated to see progress clearly.</p><button className="btn" onClick={() => onNavigate("crm")}>Open pipeline</button></section>
    </div>
    {canManage && <div className="analyticsGrid"><section className="adminCard"><div className="crmSectionHead"><div><h2>Lead sources</h2><p className="muted">Where opportunities are coming from.</p></div></div><div className="analyticsRows">{sourceStats.map(([source, stats]) => <div key={source}><b>{source}</b><span>{stats.leads} leads</span><strong>{stats.won} won</strong></div>)}{!sourceStats.length && <div className="emptyState">No source data yet.</div>}</div></section><section className="adminCard"><div className="crmSectionHead"><div><h2>Agent performance</h2><p className="muted">Assigned leads and wins so far.</p></div><button onClick={() => onNavigate("team")}>Manage team</button></div><div className="analyticsRows">{agentStats.map(({ agent, leads: count, won: wonCount }) => <div key={agent.id}><b>{agent.full_name}</b><span>{count} leads</span><strong>{wonCount} won</strong></div>)}{!agentStats.length && <div className="emptyState">No agents configured yet.</div>}</div></section></div>}
  </>;
}
