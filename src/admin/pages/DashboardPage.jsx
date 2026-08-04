import React from "react";
import { ArrowRight, CalendarClock, CircleAlert, FileText, Plus, Trophy, Users } from "lucide-react";
import { leadContact } from "../services/crmService";

export default function DashboardPage({ data, onNavigate }) {
  const leads = data.crmLeads || [];
  const pendingTasks = (data.crmTasks || []).filter((task) => task.status === "Pending");
  const nextByLead = new Map();
  pendingTasks.sort((a, b) => new Date(a.due_at) - new Date(b.due_at)).forEach((task) => {
    if (!nextByLead.has(task.lead_id)) nextByLead.set(task.lead_id, task);
  });
  const nextTasks = [...nextByLead.values()];
  const overdue = nextTasks.filter((task) => new Date(task.due_at) < new Date());
  const weekAgo = Date.now() - 7 * 86400000;
  const newThisWeek = leads.filter((lead) => new Date(lead.created_at).getTime() >= weekAgo).length;
  const highPriority = leads.filter((lead) => lead.priority_label === "High Priority" && !["Won", "Lost"].includes(lead.stage || lead.status));
  const won = leads.filter((lead) => (lead.stage || lead.status) === "Won");
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));

  return <>
    <div className="pageHead appHomeHead"><div><span className="pageEyebrow">Sales command centre</span><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}</h1><p className="muted">Here is what needs your attention today.</p></div><button className="btn primary iconTextButton" onClick={() => onNavigate("crm")}><Plus size={19}/>Add lead</button></div>

    <section className="homeActionGrid">
      <button className="homeActionCard urgent" onClick={() => onNavigate("crm")}><span><CircleAlert size={22}/></span><div><b>{overdue.length}</b><strong>Overdue follow-ups</strong><small>Handle these first</small></div><ArrowRight size={20}/></button>
      <button className="homeActionCard" onClick={() => onNavigate("crm")}><span><CalendarClock size={22}/></span><div><b>{nextTasks.length}</b><strong>Next actions</strong><small>One per active lead</small></div><ArrowRight size={20}/></button>
      <button className="homeActionCard" onClick={() => onNavigate("crm")}><span><Users size={22}/></span><div><b>{highPriority.length}</b><strong>High priority</strong><small>Strong opportunities</small></div><ArrowRight size={20}/></button>
      <button className="homeActionCard" onClick={() => onNavigate("submissions")}><span><FileText size={22}/></span><div><b>{newThisWeek}</b><strong>New this week</strong><small>Across all sources</small></div><ArrowRight size={20}/></button>
    </section>

    <div className="homeColumns">
      <section className="adminCard homeFocusList"><div className="crmSectionHead"><div><h2>Start here</h2><p className="muted">The first five follow-ups in your queue.</p></div><button onClick={() => onNavigate("crm")}>View all</button></div>
        {nextTasks.slice(0, 5).map((task) => { const lead = leadById.get(task.lead_id); const contact = leadContact(lead); return <button className="homeFocusRow" key={task.id} onClick={() => onNavigate("crm")}><span>{contact.businessName.slice(0, 1).toUpperCase()}</span><div><b>{contact.businessName}</b><small>{task.title} · {new Date(task.due_at).toLocaleDateString()}</small></div><ArrowRight size={18}/></button>; })}
        {!nextTasks.length && <div className="emptyState">Your follow-up queue is clear.</div>}
      </section>
      <section className="adminCard homeScoreCard"><span><Trophy size={24}/></span><b>{won.length}</b><h2>Won opportunities</h2><p>Keep lead stages updated to see progress clearly.</p><button className="btn" onClick={() => onNavigate("crm")}>Open pipeline</button></section>
    </div>
  </>;
}
