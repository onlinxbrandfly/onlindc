import React from "react";
import { ArrowUpRight, Building2, MessageCircle, Phone, UserRound } from "lucide-react";
import { crmCallLink, leadContact } from "../services/crmService";

export default function CRMLeadTable({ leads, agents = [], canManage = false, onOpen, onWhatsApp, onAssign }) {
  return <div className="adminCard crmLeadsPanel"><div className="crmSectionHead"><div><h3>All leads</h3><p className="muted">The most useful opportunities appear first.</p></div><b>{leads.length} leads</b></div>
    <div className="crmLeadCards">{leads.map((lead) => { const contact = leadContact(lead); const call = crmCallLink(lead); const initial = (contact.businessName || "L").slice(0, 1).toUpperCase(); return <article key={lead.id} className="crmLeadCard crmContactCard" onClick={() => onOpen(lead)}>
      <header><span className="crmContactAvatar">{initial}</span><div><h3>{contact.businessName}</h3><p><UserRound size={13} />{contact.contactName || "No contact name"}</p></div><button type="button" aria-label="Open lead" onClick={() => onOpen(lead)}><ArrowUpRight size={19} /></button></header>
      <div className="crmContactTags"><span className="crmStage">{lead.stage || lead.status || "New"}</span><span>{lead.priority_label || "Normal"}</span>{contact.industry && <span><Building2 size={12} />{contact.industry}</span>}</div>
      <div className="leadCardMeta"><span><small>Next action</small><b>{lead.next_action || "Not scheduled"}</b></span><span><small>Score</small><b>{lead.priority_score || 0}</b></span></div>
      {canManage && <select className="quickAssign" aria-label={`Assign ${contact.businessName}`} value={lead.assigned_agent_id || ""} onClick={(event) => event.stopPropagation()} onChange={(event) => onAssign(lead, event.target.value)}><option value="">Unassigned</option>{agents.filter((agent) => agent.is_active).map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name}</option>)}</select>}
      <div className="crmCardActions" onClick={(event) => event.stopPropagation()}>{call && <a href={call}><Phone size={17} />Call</a>}{contact.phone && <button onClick={() => onWhatsApp(lead)}><MessageCircle size={17} />WhatsApp</button>}<button onClick={() => onOpen(lead)}>View profile</button></div>
    </article>; })}</div>
    <div className="tableWrap"><table className="crmTable"><thead><tr><th>Business</th><th>Stage</th><th>Priority</th><th>Source</th><th>Next action</th>{canManage && <th>Owner</th>}<th>Contact</th></tr></thead><tbody>
      {leads.map((lead) => { const contact = leadContact(lead); const call = crmCallLink(lead); return <tr key={lead.id}>
        <td><button className="crmLeadLink" type="button" onClick={() => onOpen(lead)}><b>{contact.businessName}</b><small>{contact.contactName || "No contact name"} {contact.phone ? `- ${contact.phone}` : ""}</small></button></td>
        <td><span className="crmStage">{lead.stage || lead.status || "New"}</span></td>
        <td><b>{lead.priority_label}</b><small className="block">Score {lead.priority_score || 0}</small></td>
        <td>{lead.source || "Manual"}</td>
        <td>{lead.next_action || "-"}<small className="block">{lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleDateString() : "No date"}</small></td>
        {canManage && <td><select className="quickAssign" aria-label={`Assign ${contact.businessName}`} value={lead.assigned_agent_id || ""} onChange={(event) => onAssign(lead, event.target.value)}><option value="">Unassigned</option>{agents.filter((agent) => agent.is_active).map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name}</option>)}</select></td>}
        <td><div className="rowActions"><button onClick={() => onOpen(lead)}>Open</button>{call && <a href={call}>Call</a>}{contact.phone && <button onClick={() => onWhatsApp(lead)}>WhatsApp</button>}</div></td>
      </tr>; })}
      {!leads.length && <tr><td colSpan={canManage ? 7 : 6}>No leads yet. Add one or run a fresh diagnostic.</td></tr>}
    </tbody></table></div>
  </div>;
}
