import React from "react";
import { crmCallLink, crmWhatsappLink, leadContact } from "../services/crmService";

export default function CRMLeadTable({ leads, tasks, onOpen }) {
  const pending = tasks.reduce((map, task) => { if (task.status === "Pending") map[task.lead_id] = (map[task.lead_id] || 0) + 1; return map; }, {});
  return <div className="adminCard"><div className="crmSectionHead"><div><h3>All leads</h3><p className="muted">The most useful opportunities appear first.</p></div><b>{leads.length} leads</b></div>
    <div className="tableWrap"><table className="crmTable"><thead><tr><th>Business</th><th>Stage</th><th>Priority</th><th>Source</th><th>Next action</th><th>Contact</th></tr></thead><tbody>
      {leads.map((lead) => { const contact = leadContact(lead); const call = crmCallLink(lead); const whatsapp = crmWhatsappLink({ lead }); return <tr key={lead.id}>
        <td><button className="crmLeadLink" type="button" onClick={() => onOpen(lead)}><b>{contact.businessName}</b><small>{contact.contactName || "No contact name"} {contact.phone ? `- ${contact.phone}` : ""}</small></button></td>
        <td><span className="crmStage">{lead.stage || lead.status || "New"}</span></td>
        <td><b>{lead.priority_label}</b><small className="block">Score {lead.priority_score || 0}</small></td>
        <td>{lead.source || "Manual"}</td>
        <td>{lead.next_action || "-"}<small className="block">{lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleDateString() : "No date"}</small></td>
        <td><div className="rowActions"><button onClick={() => onOpen(lead)}>Open</button>{call && <a href={call}>Call</a>}{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}</div></td>
      </tr>; })}
      {!leads.length && <tr><td colSpan="6">No leads match these filters.</td></tr>}
    </tbody></table></div>
  </div>;
}
