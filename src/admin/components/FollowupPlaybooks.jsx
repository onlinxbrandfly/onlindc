import React, { useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

const FALLBACK = [
  { day_offset: 0, title: "First contact", channel: "Call" },
  { day_offset: 2, title: "Problem-specific help", channel: "WhatsApp" },
  { day_offset: 5, title: "Relevant business example", channel: "WhatsApp" },
  { day_offset: 9, title: "Useful solution", channel: "WhatsApp" },
  { day_offset: 15, title: "Soft demo invite", channel: "Call" },
  { day_offset: 30, title: "Nurture check-in", channel: "WhatsApp" }
];

export default function FollowupPlaybooks({ templates = [] }) {
  const [open, setOpen] = useState(false);
  const steps = (templates.length ? templates : FALLBACK).slice().sort((a, b) => Number(a.day_offset || 0) - Number(b.day_offset || 0));
  return <section className="followupRhythm">
    <button type="button" onClick={() => setOpen(!open)}><span><MessageCircle size={20} /><span><b>Smart follow-up rhythm</b><small>Helpful contact without overwhelming the lead</small></span></span>{open ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</button>
    {open && <div className="followupRhythmSteps">{steps.map((step, index) => <div key={step.id || `${step.title}-${index}`}><span>{Number(step.day_offset || 0) === 0 ? "Start" : `Day ${step.day_offset}`}</span><b>{step.title}</b><small>{step.channel || "WhatsApp"}{step.creative_url ? " · Poster" : step.video_url ? " · Video" : ""}</small></div>)}</div>}
  </section>;
}
