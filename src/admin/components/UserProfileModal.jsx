import React, { useState } from "react";
import { Copy, Mail, Phone, UserRound, X } from "lucide-react";
import FormLinksPanel from "./FormLinksPanel";

export default function UserProfileModal({ profile, currentAgent, onClose, onSave, notify }) {
  const { agent, leads, won, completed, overdue } = profile;
  const [form, setForm] = useState({ full_name: agent.full_name || "", phone: agent.phone || "", role: agent.role, is_active: agent.is_active });
  const canSetManager = currentAgent?.role === "admin";

  return <div className="modalBackdrop"><div className="modal builderModal userProfileModal">
    <button className="modalClose" onClick={onClose} aria-label="Close"><X size={20} /></button>
    <header className="userProfileHead"><span>{(agent.full_name || "U").slice(0, 1).toUpperCase()}</span><div><small>{agent.role}</small><h2>{agent.full_name}</h2><p><Mail size={14} />{agent.email || "No email"}{agent.phone && <><Phone size={14} />{agent.phone}</>}</p></div></header>
    <div className="agentMetrics userProfileMetrics"><span><b>{leads}</b><small>Leads</small></span><span><b>{completed}</b><small>Follow-ups</small></span><span><b>{won}</b><small>Won</small></span><span className={overdue ? "dangerText" : ""}><b>{overdue}</b><small>Overdue</small></span></div>
    <div className="userProfileGrid"><section className="crmInfoPanel"><h3>Profile</h3><label><span>Name</span><input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></label><label><span>Mobile</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label><span>Role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{canSetManager && <option value="admin">Admin</option>}{canSetManager && <option value="manager">Manager</option>}<option value="agent">Sales agent</option><option value="viewer">Viewer</option></select></label><label className="checkRow"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />Active user</label><button className="btn primary" onClick={() => onSave(agent, form)}>Save profile</button></section><section className="crmInfoPanel"><h3>Agent identity</h3><div className="profileFact"><small>Agent code</small><b>{agent.agent_code}</b><button onClick={async () => { await navigator.clipboard.writeText(agent.agent_code); notify("Agent code copied."); }}><Copy size={16} /></button></div><div className="profileFact"><small>User ID</small><code>{agent.id}</code></div><div className="profileFact"><small>Member since</small><b>{new Date(agent.created_at).toLocaleDateString()}</b></div></section></div>
    <FormLinksPanel agent={agent} notify={notify} />
  </div></div>;
}
