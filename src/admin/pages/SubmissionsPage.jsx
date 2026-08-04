import React from "react";
import { whatsappLink } from "../../utils/reportUtils";
import { Clipboard, Eye, FileText, MessageCircle } from "lucide-react";

export default function SubmissionsPage({ submissions, answers, onView, notify = () => {} }){
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
          <span className="pageEyebrow">Diagnostic reports</span>
          <h1>Reports</h1>
          <p className="muted">Review and share completed business diagnostics.</p>
        </div>
      </div>

      <div className="submissionCards">
        {submissions.map((s) => <article className="submissionCard" key={s.id}><header><div><b>{s.business_name}</b><span>{s.owner_name || "Business owner"} · {s.industries?.name || "Unknown"}</span></div><strong>{s.score_percentage}%</strong></header><p>{s.readiness_stage}</p><small>{new Date(s.created_at).toLocaleDateString()}</small><div className="submissionActions"><button onClick={() => onView(s)}><Eye size={18}/>View</button><a href={reportUrl(s)} target="_blank" rel="noreferrer"><FileText size={18}/>Report</a>{s.phone && <a href={waReport(s)} target="_blank" rel="noreferrer"><MessageCircle size={18}/>WhatsApp</a>}<button onClick={async () => { await navigator.clipboard.writeText(reportUrl(s)); notify("Report link copied."); }}><Clipboard size={18}/>Copy</button></div></article>)}
      </div>
      <div className="tableWrap submissionsTable">
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
                    <button onClick={async () => { await navigator.clipboard.writeText(reportUrl(s)); notify("Report link copied."); }}>Copy Link</button>
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
