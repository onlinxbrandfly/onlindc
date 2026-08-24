import React, { useState } from "react";
import { Send, X } from "lucide-react";
import { inviteAgent } from "../services/agentService";

export default function UserInviteModal({ currentAgent, onClose, onInvited, notify }) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "agent" });
  const [sending, setSending] = useState(false);
  const allowedRoles = currentAgent?.role === "admin" ? ["manager", "agent", "viewer"] : ["agent", "viewer"];

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    try {
      await inviteAgent(form);
      notify(`Invitation sent to ${form.email}.`);
      await onInvited();
      onClose();
    } catch (error) { notify(error.message || "Could not invite user."); }
    finally { setSending(false); }
  }

  return <div className="modalBackdrop"><form className="modal userInviteModal" onSubmit={submit}>
    <button className="modalClose" type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
    <span className="pageEyebrow">Team access</span><h2>Add user</h2><p className="muted">They will receive an email to create their password and access OnlinDC.</p>
    <label><span>Full name</span><input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></label>
    <label><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
    <label><span>Mobile number</span><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="10-digit mobile number" /></label>
    <label><span>Role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{allowedRoles.map((role) => <option value={role} key={role}>{role === "agent" ? "Sales agent" : role[0].toUpperCase() + role.slice(1)}</option>)}</select></label>
    <div className="modalActions"><button className="btn" type="button" onClick={onClose}>Cancel</button><button className="btn primary iconTextButton" disabled={sending}><Send size={17} />{sending ? "Sending..." : "Send invitation"}</button></div>
  </form></div>;
}
