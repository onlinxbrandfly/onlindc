import React, { useState } from "react";
import { crmReportUrl, crmWhatsappLink } from "../services/crmService";

export default function CRMLeadModal({ lead, tasks, events, onClose, onStatusChange, onComplete, onSkip }) {
  const [notes, setNotes] = useState(lead.notes || "");
  const submission = lead.submissions || {};
  const leadTasks = tasks.filter((task) => task.lead_id === lead.id);
  const leadEvents = events.filter((event) => event.lead_id === lead.id);

  return (
    <div className="modalBackdrop">
      <div className="modal builderModal">
        <button className="modalClose" onClick={onClose}>Ã—</button>
        <h2>{submission.business_name || "CRM Lead"}</h2>
        <p className="muted">{lead.priority_label} · Score {submission.score_percentage || 0}% · {submission.industries?.name || "Unknown industry"}</p>

        <div className="kpiGrid">
          <div className="kpi"><b>{lead.status}</b><span>Status</span></div>
          <div className="kpi"><b>{lead.priority_score}</b><span>Priority</span></div>
          <div className="kpi"><b>{leadTasks.filter(t => t.status === "Pending").length}</b><span>Pending Tasks</span></div>
        </div>

        <div className="adminCard">
          <h3>Contact</h3>
          <p><b>Owner:</b> {submission.owner_name || "-"} | <b>Phone:</b> {submission.phone || "-"} | <b>Email:</b> {submission.email || "-"}</p>
          <p><b>Pain points:</b> {(lead.detected_pain_points || []).join(", ") || "-"}</p>
          <div className="rowActions">
            <a href={crmReportUrl(submission)} target="_blank">Open Report</a>
          </div>
        </div>

        <div className="adminCard">
          <h3>Notes</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} />
          <button type="button" className="btn primary" onClick={() => onStatusChange(lead, lead.status, notes)}>Save Notes</button>
        </div>

        <div className="adminCard">
          <h3>Follow-up Plan</h3>
          <div className="tableWrap">
            <table>
              <thead><tr><th>Due</th><th>Task</th><th>Status</th><th>Message</th><th>Actions</th></tr></thead>
              <tbody>
                {leadTasks.map(task => (
                  <tr key={task.id}>
                    <td>{new Date(task.due_at).toLocaleDateString()}</td>
                    <td>{task.title}<br/><small>Day {task.sequence_day}</small></td>
                    <td>{task.status}</td>
                    <td>{task.message}</td>
                    <td>
                      <div className="rowActions">
                        <a href={crmWhatsappLink({ lead, task })} target="_blank">WhatsApp</a>
                        {task.status === "Pending" && <button type="button" onClick={() => onComplete(task)}>Done</button>}
                        {task.status === "Pending" && <button type="button" onClick={() => onSkip(task)}>Skip</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="adminCard">
          <h3>History</h3>
          {leadEvents.length ? leadEvents.map(event => (
            <div className="answerLine" key={event.id}>
              <b>{event.event_type}</b>
              <p>{event.note}</p>
              <small>{new Date(event.created_at).toLocaleString()}</small>
            </div>
          )) : <p className="muted">No CRM history yet.</p>}
        </div>
      </div>
    </div>
  );
}
