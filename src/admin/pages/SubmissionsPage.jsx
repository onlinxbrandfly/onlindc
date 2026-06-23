import React from "react";
import { whatsappLink } from "../../utils/reportUtils";

export default function SubmissionsPage({ submissions, answers, onView }){
  function reportUrl(s){
    if(s.report_url) return s.report_url;
    if(s.report_slug) return `${window.location.origin}/report/${s.report_slug}`;
    return `${window.location.origin}/report/${s.id}`;
  }

  function waReport(s){
    return whatsappLink(s.phone, `Hello ${s.owner_name || ""}, your Onlin Business Diagnostic Report is ready. You can view it here: ${reportUrl(s)}`);
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <h1>Submissions</h1>
          <p className="muted">View reports, print reports, copy links or follow up on WhatsApp.</p>
        </div>
      </div>

      <div className="tableWrap">
        <table>
          <thead><tr><th>Business</th><th>Owner</th><th>Phone</th><th>Industry</th><th>Score</th><th>Stage</th><th>Actions</th></tr></thead>
          <tbody>
            {submissions.map(s => (
              <tr key={s.id}>
                <td><b>{s.business_name}</b><br/><small>{new Date(s.created_at).toLocaleString()}</small></td>
                <td>{s.owner_name}</td>
                <td>{s.phone}</td>
                <td>{s.industries?.name}</td>
                <td><b>{s.score_percentage}%</b></td>
                <td>{s.readiness_stage}</td>
                <td>
                  <div className="rowActions">
                    <button onClick={() => onView(s)}>View</button>
                    <button onClick={() => { onView(s); setTimeout(() => window.print(), 350); }}>Print</button>
                    <a href={reportUrl(s)} target="_blank">Report</a>
                    <button onClick={() => navigator.clipboard.writeText(reportUrl(s))}>Copy Link</button>
                    <a href={waReport(s)} target="_blank">WhatsApp</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
