import React, { useState } from "react";
import { CRM_CHANNELS, CRM_STAGES, crmCallLink, crmReportUrl, leadContact } from "../services/crmService";

function localDateTime(days = 1) {
  const date = new Date(); date.setDate(date.getDate() + days); date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function CRMLeadModal({ lead, tasks, events, onClose, onEdit, onStatusChange, onAddActivity, onCreateTask, onComplete, onSkip, onReschedule, onWhatsApp }) {
  const contact = leadContact(lead);
  const leadTasks = tasks.filter((task) => task.lead_id === lead.id);
  const leadEvents = events.filter((event) => event.lead_id === lead.id).sort((a, b) => new Date(b.occurred_at || b.created_at) - new Date(a.occurred_at || a.created_at));
  const [activity, setActivity] = useState({ channel: "Call", outcome: "Connected", note: "" });
  const [task, setTask] = useState({ title: "Follow up", channel: "Call", dueAt: localDateTime(), message: "" });
  const report = crmReportUrl(lead);
  const call = crmCallLink(lead);

  return <div className="modalBackdrop"><div className="modal builderModal crmLeadDetail">
    <button className="modalClose" onClick={onClose} aria-label="Close">x</button>
    <div className="crmDetailHead"><div><span className="crmStage">{lead.stage || lead.status}</span><h2>{contact.businessName}</h2><p>{contact.contactName || "No contact name"} {contact.phone ? `- ${contact.phone}` : ""}</p></div><div className="rowActions"><button onClick={() => onEdit(lead)}>Edit</button>{call && <a href={call}>Call</a>}{contact.phone && <button onClick={() => onWhatsApp(lead)}>WhatsApp</button>}{report && <a href={report} target="_blank" rel="noreferrer">Report</a>}</div></div>

    <div className="crmDetailGrid">
      <main>
        <section className="crmInfoPanel"><h3>Lead overview</h3><div className="crmFacts"><span><small>Priority</small><b>{lead.priority_label}</b></span><span><small>Source</small><b>{lead.source || "Manual"}</b></span><span><small>Industry</small><b>{contact.industry || "Not selected"}</b></span><span><small>Interest</small><b>{lead.temperature || "Warm"}</b></span><span><small>City</small><b>{lead.city || "-"}</b></span><span><small>Expected value</small><b>{lead.estimated_value ? `INR ${Number(lead.estimated_value).toLocaleString("en-IN")}` : "-"}</b></span></div>
          <p><b>Problems:</b> {(lead.detected_pain_points || []).join(", ") || "Not recorded"}</p><p><b>Needs:</b> {lead.requirements || "Not recorded"}</p><p><b>Notes:</b> {lead.notes || "No notes yet"}</p>
        </section>

        <section className="crmInfoPanel"><div className="crmSectionHead"><h3>Follow-up plan</h3><b>{leadTasks.filter((item) => item.status === "Pending").length} pending</b></div>
          {leadTasks.sort((a, b) => new Date(a.due_at) - new Date(b.due_at)).map((item) => <div className="crmMiniTask" key={item.id}><div><b>{item.title}</b><small>{item.channel} - {new Date(item.due_at).toLocaleString()} - {item.status}</small></div><div className="rowActions">{item.status === "Pending" && <>{item.channel?.toLowerCase() === "whatsapp" && <button onClick={() => onWhatsApp(lead, item)}>WhatsApp</button>}<button onClick={() => onComplete(item)}>Done</button><button onClick={() => onReschedule(item)}>Later</button><button onClick={() => onSkip(item)}>Skip</button></>}</div></div>)}
          {!leadTasks.length && <p className="muted">No follow-ups created yet.</p>}
          <form className="crmInlineForm" onSubmit={(e) => { e.preventDefault(); onCreateTask({ ...task, dueAt: new Date(task.dueAt).toISOString() }); }}><input value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} required /><select value={task.channel} onChange={(e) => setTask({ ...task, channel: e.target.value })}>{CRM_CHANNELS.filter((item) => item !== "Note").map((item) => <option key={item}>{item}</option>)}</select><input type="datetime-local" value={task.dueAt} onChange={(e) => setTask({ ...task, dueAt: e.target.value })} required /><button className="btn">Add follow-up</button></form>
        </section>
      </main>

      <aside>
        <section className="crmInfoPanel"><h3>Move lead</h3><select value={lead.stage || lead.status || "New"} onChange={(e) => onStatusChange(lead, e.target.value)}>{CRM_STAGES.map((item) => <option key={item}>{item}</option>)}</select></section>
        <section className="crmInfoPanel"><h3>Record activity</h3><select value={activity.channel} onChange={(e) => setActivity({ ...activity, channel: e.target.value })}>{CRM_CHANNELS.map((item) => <option key={item}>{item}</option>)}</select><input value={activity.outcome} onChange={(e) => setActivity({ ...activity, outcome: e.target.value })} placeholder="Outcome" /><textarea value={activity.note} onChange={(e) => setActivity({ ...activity, note: e.target.value })} placeholder="What happened?" /><button className="btn primary" onClick={() => { onAddActivity(activity); setActivity({ ...activity, note: "" }); }}>Add to history</button></section>
        <section className="crmInfoPanel"><h3>History</h3><div className="crmTimeline">{leadEvents.map((event) => <div key={event.id}><b>{event.channel || event.event_type}</b><span>{event.outcome || event.note || "Activity recorded"}</span>{event.note && event.outcome && <small>{event.note}</small>}<time>{new Date(event.occurred_at || event.created_at).toLocaleString()}</time></div>)}{!leadEvents.length && <p className="muted">No activity yet.</p>}</div></section>
      </aside>
    </div>
  </div></div>;
}
