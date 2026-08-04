import React from "react";
import { crmCallLink, crmWhatsappLink, leadContact } from "../services/crmService";

function bucket(task) {
  const due = new Date(task.due_at);
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  if (due.getTime() < Date.now()) return "Overdue";
  if (due <= endToday) return "Today";
  return "Upcoming";
}

export default function CRMFollowupTasks({ tasks, leads, onComplete, onSkip, onReschedule, limit = 30 }) {
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const pending = tasks.filter((task) => task.status === "Pending").sort((a, b) => new Date(a.due_at) - new Date(b.due_at)).slice(0, limit);
  return <div className="adminCard crmTaskList">
    <div className="crmSectionHead"><div><h3>Follow-ups</h3><p className="muted">Work from the top. Overdue and today’s actions come first.</p></div><b>{pending.length} pending</b></div>
    {pending.length ? pending.map((task) => {
      const lead = leadById.get(task.lead_id);
      const contact = leadContact(lead);
      const call = lead && crmCallLink(lead);
      const whatsapp = lead && crmWhatsappLink({ lead, task });
      return <article className={`crmTask ${bucket(task).toLowerCase()}`} key={task.id}>
        <div className="taskDue"><b>{bucket(task)}</b><span>{new Date(task.due_at).toLocaleDateString()}</span></div>
        <div className="taskMain"><b>{task.title}</b><span>{contact.businessName} {contact.contactName ? `- ${contact.contactName}` : ""}</span><small>{task.message || task.channel}</small></div>
        <div className="rowActions">
          {call && <a href={call}>Call</a>}{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
          <button type="button" onClick={() => onComplete(task)}>Done</button>
          <button type="button" onClick={() => onReschedule(task)}>Later</button>
          <button type="button" onClick={() => onSkip(task)}>Skip</button>
        </div>
      </article>;
    }) : <div className="emptyState">Nothing is due. Your follow-up list is clear.</div>}
  </div>;
}
