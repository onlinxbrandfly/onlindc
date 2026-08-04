import React from "react";
import { crmCallLink, leadContact } from "../services/crmService";

export default function CRMLeadTable({ leads, tasks, onOpen, onWhatsApp }) {
  const pending = tasks.reduce((map, task) => { if (task.status === "Pending") map[task.lead_id] = (map[task.lead_id] || 0) + 1; return map; }, {});
  return <div className="adminCard crmLeadsPanel"><div className="crmSectionHead"><div><h3>All leads</h3><p className="muted">The most useful opportunities appear first.</p></div><b>{leads.length} leads</b></div>
    <div className="crmLeadCards">{leads.map((lead) => { const contact = leadContact(lead); const call = crmCallLink(lead); return <article key={lead.id} className="crmLeadCard" onClick={() => onOpen(lead)}><div><span className="crmStage">{lead.stage || lead.status || "New"}</span><h3>{contact.businessName}</h3><p>{contact.contactName || "No contact name"}{contact.phone ? ` - ${contact.phone}` : ""}</p></div><div className="leadCardMeta"><b>{lead.priority_label}</b><span>{lead.next_action || "No next action"}</span></div><div className="rowActions" onClick={(event) => event.stopPropagation()}>{call && <a href={call}>Call</a>}{contact.phone && <button onClick={() => onWhatsApp(lead)}>WhatsApp</button>}<button onClick={() => onOpen(lead)}>Open</button></div></article>; })}</div>
    <div className="tableWrap"><table className="crmTable"><thead><tr><th>Business</th><th>Stage</th><th>Priority</th><th>Source</th><th>Next action</th><th>Contact</th></tr></thead><tbody>
      {leads.map((lead) => { const contact = leadContact(lead); const call = crmCallLink(lead); return <tr key={lead.id}>
        <td><button className="crmLeadLink" type="button" onClick={() => onOpen(lead)}><b>{contact.businessName}</b><small>{contact.contactName || "No contact name"} {contact.phone ? `- ${contact.phone}` : ""}</small></button></td>
        <td><span className="crmStage">{lead.stage || lead.status || "New"}</span></td>
        <td><b>{lead.priority_label}</b><small className="block">Score {lead.priority_score || 0}</small></td>
        <td>{lead.source || "Manual"}</td>
        <td>{lead.next_action || "-"}<small className="block">{lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleDateString() : "No date"}</small></td>
        <td><div className="rowActions"><button onClick={() => onOpen(lead)}>Open</button>{call && <a href={call}>Call</a>}{contact.phone && <button onClick={() => onWhatsApp(lead)}>WhatsApp</button>}</div></td>
      </tr>; })}
      {!leads.length && <tr><td colSpan="6">No leads match these filters.</td></tr>}
    </tbody></table></div>
  </div>;
}
