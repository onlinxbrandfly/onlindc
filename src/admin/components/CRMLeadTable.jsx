import React from "react";
import { crmReportUrl, crmWhatsappLink } from "../services/crmService";

const STATUSES = ["New", "Contacted", "Interested", "Demo Booked", "Won", "Lost", "Nurture"];

function scoreOf(lead) {
  return Number(lead.submissions?.score_percentage || 0);
}

export default function CRMLeadTable({ leads, tasks, onOpen, onStatusChange }) {
  const pendingByLead = tasks.reduce((acc, task) => {
    if (task.status !== "Pending") return acc;
    acc[task.lead_id] = (acc[task.lead_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="adminCard">
      <h3>CRM Leads</h3>
      <p className="muted">Low-score leads are ranked as higher-need Onlin opportunities.</p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Need</th>
              <th>Score</th>
              <th>Status</th>
              <th>Pain Points</th>
              <th>Pending</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const submission = lead.submissions || {};
              const firstTask = tasks.find((task) => task.lead_id === lead.id && task.status === "Pending");
              return (
                <tr key={lead.id}>
                  <td>
                    <b>{submission.business_name || "Unnamed Business"}</b>
                    <br />
                    <small>{submission.owner_name || "Business Owner"} · {submission.phone || "No phone"}</small>
                  </td>
                  <td><b>{lead.priority_label}</b><br/><small>Priority {lead.priority_score}</small></td>
                  <td>{scoreOf(lead)}%</td>
                  <td>
                    <select value={lead.status || "New"} onChange={e => onStatusChange(lead, e.target.value)}>
                      {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>{(lead.detected_pain_points || []).slice(0, 2).join(", ") || "-"}</td>
                  <td>{pendingByLead[lead.id] || 0}</td>
                  <td>
                    <div className="rowActions">
                      <button type="button" onClick={() => onOpen(lead)}>Open</button>
                      <a href={crmReportUrl(submission)} target="_blank">Report</a>
                      {firstTask && <a href={crmWhatsappLink({ lead, task: firstTask })} target="_blank">WhatsApp</a>}
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
