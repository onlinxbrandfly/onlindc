import React, { useMemo, useState } from "react";
import { Check, Clipboard, ExternalLink, Image, MessageCircle, Video, X } from "lucide-react";
import { crmWhatsappLink, leadContact } from "../services/crmService";

export default function WhatsAppComposer({ lead, task, onClose, onOutcome, onReschedule }) {
  const contact = leadContact(lead);
  const [message, setMessage] = useState(task?.message || `Hello ${contact.contactName || "there"}, I am reaching out from Onlin regarding ${contact.businessName}.`);
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaUrl = task?.creative_url || task?.video_url || "";
  const mediaType = task?.creative_url ? "Poster" : task?.video_url ? "Video" : "";
  const whatsappUrl = useMemo(() => crmWhatsappLink({ lead, message }), [lead, message]);

  async function copyMessage() { await navigator.clipboard.writeText(message); }
  function openWhatsApp() {
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setOpened(true);
  }
  async function finish(outcome) {
    setBusy(true);
    try { await onOutcome(outcome, message); onClose(); }
    finally { setBusy(false); }
  }

  return <div className="appSheetBackdrop" onClick={onClose}>
    <section className="appSheet whatsappComposer" onClick={(event) => event.stopPropagation()}>
      <div className="appSheetHandle" />
      <header><div><h2>Send on WhatsApp</h2><p>{contact.businessName} · {contact.phone}</p></div><button aria-label="Close WhatsApp composer" onClick={onClose}><X size={22} /></button></header>
      <div className="whatsappStep"><span>1</span><div><b>Check the message</b><small>Edit it before opening WhatsApp.</small></div></div>
      <textarea className="whatsappMessage" value={message} onChange={(event) => setMessage(event.target.value)} rows="6" />
      <button className="whatsappUtility" type="button" onClick={copyMessage}><Clipboard size={18} />Copy message</button>
      {mediaUrl && <><div className="whatsappStep"><span>2</span><div><b>Prepare the {mediaType.toLowerCase()}</b><small>Open it, then attach it inside WhatsApp.</small></div></div><a className="whatsappMedia" href={mediaUrl} target="_blank" rel="noreferrer">{mediaType === "Poster" ? <Image size={22} /> : <Video size={22} />}<span><b>{mediaType} ready</b><small>{mediaUrl}</small></span><ExternalLink size={18} /></a></>}
      <div className="whatsappStep"><span>{mediaUrl ? "3" : "2"}</span><div><b>Open the conversation</b><small>The mobile number and message are already prepared.</small></div></div>
      <button className="whatsappOpen" type="button" onClick={openWhatsApp} disabled={!whatsappUrl}><MessageCircle size={20} />Open WhatsApp</button>
      {!whatsappUrl && <p className="fieldError">Add a valid mobile number before sending WhatsApp.</p>}
      {opened && <div className="whatsappOutcome"><b>What happened?</b><div><button disabled={busy} onClick={() => finish("WhatsApp sent")}><Check size={17} />Sent</button><button disabled={busy} onClick={() => finish("Replied")}>Replied</button><button disabled={busy} onClick={() => finish("No response")}>No response</button>{task && <button disabled={busy} onClick={() => { onClose(); onReschedule(task); }}>Send later</button>}</div></div>}
    </section>
  </div>;
}
