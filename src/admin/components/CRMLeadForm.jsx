import React, { useMemo, useState } from "react";
import { CRM_SOURCES, CRM_STAGES, findPossibleDuplicates } from "../services/crmService";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

function localDateTime(value) {
  const date = value ? new Date(value) : new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function CRMLeadForm({ lead, leads, industries, painPoints = [], agents = [], canManage = false, currentAgent, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    business_name: lead?.business_name || "",
    contact_name: lead?.contact_name || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    city: lead?.city || "",
    industry_id: lead?.industry_id || "",
    source: lead?.source || "Manual",
    source_detail: lead?.source_detail || "",
    stage: lead?.stage || lead?.status || "New",
    temperature: lead?.temperature || "Warm",
    detected_pain_points: lead?.detected_pain_points || [],
    problem_notes: lead?.problem_notes || "",
    requirements: lead?.requirements || "",
    notes: lead?.notes || "",
    estimated_value: lead?.estimated_value || "",
    assigned_agent_id: lead?.assigned_agent_id || currentAgent?.id || "",
    next_action: lead?.next_action || "Make first contact",
    next_followup_at: localDateTime(lead?.next_followup_at),
    createPlan: !lead
  });
  const duplicates = useMemo(() => findPossibleDuplicates(leads, values, lead?.id), [leads, values.phone, values.email, lead?.id]);
  const availablePainPoints = useMemo(() => painPoints.filter((item) => item.is_active !== false), [painPoints]);

  function set(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (event.nativeEvent.submitter?.dataset.action !== "save-lead") return;
    if (!values.business_name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...values,
        next_followup_at: new Date(values.next_followup_at).toISOString()
      }, lead?.id);
    } finally {
      setSaving(false);
    }
  }

  const steps = ["Contact", "Business", "Follow-up"];

  function addPainPoint(title) {
    if (!title || values.detected_pain_points.includes(title)) return;
    set("detected_pain_points", [...values.detected_pain_points, title]);
  }

  function removePainPoint(title) {
    set("detected_pain_points", values.detected_pain_points.filter((item) => item !== title));
  }

  return (
    <div className="modalBackdrop">
      <form className="modal crmLeadForm appFormSheet" onSubmit={submit}>
        <button type="button" className="modalClose" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <h2>{lead ? "Edit lead" : "New lead"}</h2>
        <div className="formSteps">{steps.map((item, index) => <span key={item} className={index <= step ? "active" : ""}><i>{index < step ? <Check size={13} /> : index + 1}</i>{item}</span>)}</div>

        {duplicates.length > 0 && (
          <div className="crmWarning">
            <b>Possible duplicate found</b>
            <span>{duplicates.map((item) => item.business_name || "Existing lead").join(", ")}. Check before saving another lead.</span>
          </div>
        )}

        {step === 0 && <div className="crmStepPanel"><p className="muted">Start with what you know. Only the business name is required.</p><div className="crmFormGrid">
          <label><span>Business name *</span><input value={values.business_name} onChange={(e) => set("business_name", e.target.value)} required /></label>
          <label><span>Contact person</span><input value={values.contact_name} onChange={(e) => set("contact_name", e.target.value)} /></label>
          <label><span>Mobile number</span><input inputMode="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98765 43210" /></label>
          <label><span>Email</span><input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} /></label>
          <label><span>Industry</span><select value={values.industry_id} onChange={(e) => set("industry_id", e.target.value)}><option value="">Not selected</option>{industries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span>City</span><input value={values.city} onChange={(e) => set("city", e.target.value)} /></label>
        </div></div>}
        {step === 1 && <div className="crmStepPanel"><p className="muted">Capture why this lead matters and what they need.</p><div className="crmFormGrid">
          <label><span>Lead source</span><select value={values.source} onChange={(e) => set("source", e.target.value)}>{CRM_SOURCES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Source details</span><input value={values.source_detail} onChange={(e) => set("source_detail", e.target.value)} placeholder="Who referred them or campaign name" /></label>
          <label><span>Current stage</span><select value={values.stage} onChange={(e) => set("stage", e.target.value)}>{CRM_STAGES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Interest level</span><select value={values.temperature} onChange={(e) => set("temperature", e.target.value)}><option>Hot</option><option>Warm</option><option>Cold</option></select></label>
          <label><span>Expected value</span><input type="number" min="0" value={values.estimated_value} onChange={(e) => set("estimated_value", e.target.value)} placeholder="INR" /></label>
        </div>
        <label><span>Problems / pain points</span><select value="" onChange={(e) => addPainPoint(e.target.value)}><option value="">Select a problem</option>{availablePainPoints.filter((item) => !values.detected_pain_points.includes(item.title)).map((item) => <option key={item.code} value={item.title}>{item.title}</option>)}</select></label>
        {values.detected_pain_points.length > 0 && <div className="selectedPainPoints">{values.detected_pain_points.map((item) => <span key={item}>{item}<button type="button" onClick={() => removePainPoint(item)} aria-label={`Remove ${item}`}><X size={14} /></button></span>)}</div>}
        <label><span>Problem notes</span><textarea value={values.problem_notes} onChange={(e) => set("problem_notes", e.target.value)} placeholder="Add context, examples or what the customer said" /></label>
        <label><span>What do they need?</span><textarea value={values.requirements} onChange={(e) => set("requirements", e.target.value)} /></label></div>}
        {step === 2 && <div className="crmStepPanel"><p className="muted">Decide the next clear action. You can change this anytime.</p><div className="crmFormGrid">
          <label><span>Next action</span><input value={values.next_action} onChange={(e) => set("next_action", e.target.value)} /></label>
          <label><span>Follow up on</span><input type="datetime-local" value={values.next_followup_at} onChange={(e) => set("next_followup_at", e.target.value)} required /></label>
          <label><span>Assigned to</span><select value={values.assigned_agent_id} disabled={!canManage} onChange={(e) => set("assigned_agent_id", e.target.value)}><option value="">Unassigned</option>{agents.filter((agent) => agent.is_active).map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name}</option>)}</select></label>
        </div>
        <label><span>Internal notes</span><textarea value={values.notes} onChange={(e) => set("notes", e.target.value)} /></label>
        {!lead && <label className="checkRow"><input type="checkbox" checked={values.createPlan} onChange={(e) => set("createPlan", e.target.checked)} /> Create a gentle 30-day follow-up plan</label>}
        </div>}
        <div className="modalActions appFormActions">
          {step > 0 ? <button type="button" className="btn" onClick={() => setStep(step - 1)}><ArrowLeft size={18} /> Back</button> : <button type="button" className="btn" onClick={onClose}>Cancel</button>}
          {step < 2 ? <button type="button" className="btn primary" disabled={step === 0 && !values.business_name.trim()} onClick={() => setStep((current) => Math.min(current + 1, 2))}>Continue <ArrowRight size={18} /></button> : <button type="submit" data-action="save-lead" className="btn primary" disabled={saving}>{saving ? "Saving..." : "Save lead"}</button>}
        </div>
      </form>
    </div>
  );
}
