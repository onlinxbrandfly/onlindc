import React from "react";
import { CalendarClock, Check, Clock3, MessageCircle, Phone } from "lucide-react";
import { crmCallLink, leadContact } from "../services/crmService";

function bucket(task) {
  const due = new Date(task.due_at);
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  if (due.getTime() < Date.now()) return "Overdue";
  if (due <= endToday) return "Today";
  return "Upcoming";
}

export default function CRMFollowupTasks({ tasks, leads, onComplete, onSkip, onReschedule, onWhatsApp, limit = 30 }) {
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const nextByLead = new Map();
  tasks.filter((task) => task.status === "Pending").sort((a, b) => new Date(a.due_at) - new Date(b.due_at)).forEach((task) => {
    if (!nextByLead.has(task.lead_id)) nextByLead.set(task.lead_id, task);
  });
  const pending = [...nextByLead.values()].slice(0, limit);
  return <div className="adminCard crmTaskList">
    <div className="crmSectionHead"><div><h3>Follow-ups</h3><p className="muted">Work from the top. Overdue and today’s actions come first.</p></div><b>{pending.length} pending</b></div>
    {pending.length ? pending.map((task) => {
      const lead = leadById.get(task.lead_id);
      const contact = leadContact(lead);
      const call = lead && crmCallLink(lead);
      return <article className={`crmTask ${bucket(task).toLowerCase()}`} key={task.id}>
        <div className="taskDue"><span className="taskIcon"><CalendarClock size={19} /></span><div><b>{bucket(task)}</b><span>{new Date(task.due_at).toLocaleDateString()}</span></div></div>
        <div className="taskMain"><b>{task.title}</b><span>{contact.businessName} {contact.contactName ? `- ${contact.contactName}` : ""}</span><small>{task.message || task.channel}</small></div>
        <div className="rowActions">
          {call && <a href={call}><Phone size={15} />Call</a>}{contact.phone && <button type="button" onClick={() => onWhatsApp(lead, task)}><MessageCircle size={15} />WhatsApp</button>}
          <button type="button" className="taskDone" onClick={() => onComplete(task)}><Check size={15} />Done</button>
          <button type="button" onClick={() => onReschedule(task)}><Clock3 size={15} />Later</button>
          <button type="button" onClick={() => onSkip(task)}>Skip</button>
        </div>
      </article>;
    }) : <div className="emptyState">Nothing is due. Your follow-up list is clear.</div>}
  </div>;
}
