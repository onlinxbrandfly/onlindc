import React from "react";
import { crmWhatsappLink } from "../services/crmService";

function taskBucket(task) {
  const due = new Date(task.due_at).getTime();
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (due < Date.now()) return "Overdue";
  if (due <= today.getTime()) return "Due Today";
  return "Upcoming";
}

export default function CRMFollowupTasks({ tasks, leads, onComplete, onSkip }) {
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const pendingTasks = tasks
    .filter((task) => task.status === "Pending")
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, 20);

  return (
    <div className="adminCard">
      <h3>Follow-up Tasks</h3>
      <p className="muted">Manual follow-ups only. Open WhatsApp, send the message, then mark completed.</p>
      <div className="tableWrap">
        <table>
          <thead><tr><th>Due</th><th>Lead</th><th>Task</th><th>Message</th><th>Actions</th></tr></thead>
          <tbody>
            {pendingTasks.map((task) => {
              const lead = leadById.get(task.lead_id);
              const submission = lead?.submissions || {};
              return (
                <tr key={task.id}>
                  <td><b>{taskBucket(task)}</b><br/><small>{new Date(task.due_at).toLocaleDateString()}</small></td>
                  <td>{submission.business_name || "Lead"}<br/><small>{lead?.priority_label}</small></td>
                  <td>{task.title}<br/><small>Day {task.sequence_day}</small></td>
                  <td>{task.message}</td>
                  <td>
                    <div className="rowActions">
                      {lead && <a href={crmWhatsappLink({ lead, task })} target="_blank">WhatsApp</a>}
                      <button type="button" onClick={() => onComplete(task)}>Done</button>
                      <button type="button" onClick={() => onSkip(task)}>Skip</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
