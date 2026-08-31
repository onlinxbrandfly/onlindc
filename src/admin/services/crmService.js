import { supabase } from "../../services/supabase";

export const CRM_STAGES = [
  "New", "Attempting Contact", "Connected", "Qualified", "Interested",
  "Demo Scheduled", "Proposal Sent", "Won", "Lost", "Nurture"
];

export const CRM_SOURCES = [
  "Manual", "Diagnostic", "Cold Call", "Referral", "Website", "WhatsApp",
  "Instagram", "Exhibition", "Partner", "Other"
];

export const CRM_CHANNELS = ["Call", "WhatsApp", "Email", "Meeting", "Demo", "Note"];

const FOLLOWUP_SEQUENCE = [
  { day: 0, title: "First contact", channel: "Call" },
  { day: 2, title: "Problem-specific help", channel: "WhatsApp" },
  { day: 5, title: "Relevant business example", channel: "WhatsApp" },
  { day: 9, title: "Useful solution", channel: "WhatsApp" },
  { day: 15, title: "Soft demo invite", channel: "Call" },
  { day: 30, title: "Nurture check-in", channel: "WhatsApp" }
];

export function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function leadContact(lead) {
  const submission = lead?.submissions || {};
  return {
    businessName: lead?.business_name || submission.business_name || "Unnamed Business",
    contactName: lead?.contact_name || submission.owner_name || "",
    phone: lead?.phone || submission.phone || "",
    email: lead?.email || submission.email || "",
    score: lead?.diagnostic_score ?? submission.score_percentage ?? null,
    industry: lead?.industries?.name || submission.industries?.name || ""
  };
}

export function crmReportUrl(leadOrSubmission) {
  const submission = leadOrSubmission?.submissions || leadOrSubmission || {};
  if (!submission.id && !submission.report_slug && !submission.report_url) return "";
  if (submission.report_url) return submission.report_url;
  if (submission.report_slug) return `${window.location.origin}/report/${submission.report_slug}`;
  return `${window.location.origin}/report/${submission.id}`;
}

export function crmWhatsappLink({ lead, task, message }) {
  const phone = normalizePhone(leadContact(lead).phone);
  if (!phone) return "";
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message ?? task?.message ?? "")}`;
}

export function crmCallLink(lead) {
  const phone = normalizePhone(leadContact(lead).phone);
  return phone ? `tel:+91${phone}` : "";
}

function addDays(dateValue, days) {
  const date = new Date(dateValue || Date.now());
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString();
}

function getPainPoints(answers, submissionId) {
  return (answers || [])
    .filter((answer) => answer.submission_id === submissionId)
    .filter((answer) => answer.questions?.question_key === "pain_points")
    .flatMap((answer) => answer.selected_option_texts || [])
    .filter(Boolean);
}

function priorityFor({ score, painPoints = [], temperature = "Warm", source = "Manual" }) {
  let total = score == null ? 35 : Math.max(0, 100 - Number(score));
  total += Math.min(20, painPoints.length * 5);
  if (temperature === "Hot") total += 25;
  if (temperature === "Warm") total += 10;
  if (["Referral", "Website", "Diagnostic"].includes(source)) total += 8;
  total = Math.min(125, Math.round(total));
  const label = total >= 85 ? "High Priority" : total >= 55 ? "Good Opportunity" : "Nurture";
  return { score: total, label };
}

function fillTemplate(template, lead, painPoints) {
  const contact = leadContact(lead);
  return String(template || "")
    .replaceAll("{{owner_name}}", contact.contactName || "there")
    .replaceAll("{{business_name}}", contact.businessName)
    .replaceAll("{{report_url}}", crmReportUrl(lead))
    .replaceAll("{{pain_point}}", painPoints?.[0] || "manual business gaps");
}

function defaultMessage(step, lead, painPoints) {
  const contact = leadContact(lead);
  const pain = painPoints?.[0] || "manual workflows";
  const messages = {
    "First contact": `Hello ${contact.contactName || "there"}, I am reaching out from Onlin regarding ${contact.businessName}. Is this a good time for a quick conversation?`,
    "Problem-specific help": `You mentioned ${pain}. We have a practical way to make this more structured. Would a short example be useful?`,
    "Relevant business example": `I can show you how a similar business improved its digital selling process. Would you like to see it for ${contact.businessName}?`,
    "Useful solution": `One useful next step for ${contact.businessName} could be a structured catalogue and selling flow that reduces repeated manual work.`,
    "Soft demo invite": `Would a short, business-specific Onlin demo be useful this week?`,
    "Nurture check-in": `Checking in with one practical idea for ${contact.businessName}: make products easier to discover and share through one structured link.`
  };
  return messages[step.title] || "Follow up with this lead.";
}

async function insertSequence(lead, templates = [], startAt = new Date().toISOString()) {
  const painPoints = lead.detected_pain_points || [];
  const templateByTitle = new Map(templates.map((template) => [template.title, template]));
  const rows = FOLLOWUP_SEQUENCE.map((step) => {
    const template = templateByTitle.get(step.title);
    return {
      lead_id: lead.id,
      assigned_agent_id: lead.assigned_agent_id || null,
      template_id: template?.id || null,
      sequence_day: step.day,
      title: step.title,
      channel: template?.channel || step.channel,
      due_at: addDays(startAt, step.day),
      status: "Pending",
      message: template?.message ? fillTemplate(template.message, lead, painPoints) : defaultMessage(step, lead, painPoints),
      creative_url: template?.creative_url || null,
      video_url: template?.video_url || null
    };
  });
  const { error } = await supabase.from("crm_followup_tasks").insert(rows);
  if (error) throw error;
  return rows.length;
}

export function findPossibleDuplicates(leads, values, editingId) {
  const phone = normalizePhone(values.phone);
  const email = String(values.email || "").trim().toLowerCase();
  return (leads || []).filter((lead) => {
    if (lead.id === editingId) return false;
    const contact = leadContact(lead);
    return (phone && normalizePhone(contact.phone) === phone) ||
      (email && String(contact.email || "").trim().toLowerCase() === email);
  });
}

export async function saveCrmLead({ values, leadId, templates = [], createPlan = true }) {
  const { data: { user } } = await supabase.auth.getUser();
  const priority = priorityFor({
    score: values.diagnostic_score,
    painPoints: values.detected_pain_points,
    temperature: values.temperature,
    source: values.source
  });
  const payload = {
    business_name: values.business_name.trim(),
    contact_name: values.contact_name?.trim() || null,
    phone: values.phone?.trim() || null,
    normalized_phone: normalizePhone(values.phone) || null,
    email: values.email?.trim() || null,
    city: values.city?.trim() || null,
    industry_id: values.industry_id || null,
    source: values.source || "Manual",
    source_detail: values.source_detail?.trim() || null,
    stage: values.stage || "New",
    status: values.stage || "New",
    temperature: values.temperature || "Warm",
    detected_pain_points: values.detected_pain_points || [],
    problem_notes: values.problem_notes?.trim() || null,
    requirements: values.requirements?.trim() || null,
    notes: values.notes?.trim() || null,
    estimated_value: values.estimated_value ? Number(values.estimated_value) : null,
    assigned_agent_id: values.assigned_agent_id || user?.id || null,
    created_by_agent_id: leadId ? undefined : user?.id || null,
    assigned_at: values.assigned_agent_id || user?.id ? new Date().toISOString() : null,
    next_action: values.next_action?.trim() || "Make first contact",
    next_followup_at: values.next_followup_at || new Date().toISOString(),
    priority_score: priority.score,
    priority_label: priority.label,
    updated_at: new Date().toISOString()
  };

  if (leadId) {
    const { data, error } = await supabase.from("crm_leads").update(payload).eq("id", leadId).select("*").single();
    if (error) throw error;
    await addCrmActivity({ leadId, type: "lead_updated", note: "Lead details updated" });
    return data;
  }

  const { data, error } = await supabase.from("crm_leads").insert(payload).select("*").single();
  if (error) throw error;
  await addCrmActivity({ leadId: data.id, type: "lead_created", note: `${payload.source} lead created` });
  if (createPlan) await insertSequence(data, templates, payload.next_followup_at);
  return data;
}

export async function syncCrmFromSubmissions({ submissions, answers, templates }) {
  const { data: existingRows, error } = await supabase.from("crm_leads").select("id, submission_id");
  if (error) throw error;
  const existing = new Set((existingRows || []).map((lead) => lead.submission_id).filter(Boolean));
  const missing = (submissions || []).filter((submission) => !existing.has(submission.id));
  let tasks = 0;
  for (const submission of missing) {
    const painPoints = getPainPoints(answers, submission.id);
    const priority = priorityFor({ score: submission.score_percentage, painPoints, source: "Diagnostic" });
    const payload = {
      submission_id: submission.id,
      industry_id: submission.industry_id,
      business_name: submission.business_name || "Unnamed Business",
      contact_name: submission.owner_name || null,
      phone: submission.phone || null,
      normalized_phone: normalizePhone(submission.phone) || null,
      email: submission.email || null,
      source: "Diagnostic",
      assigned_agent_id: submission.source_agent_id || null,
      created_by_agent_id: submission.source_agent_id || null,
      stage: "New",
      status: "New",
      temperature: "Warm",
      diagnostic_score: submission.score_percentage,
      priority_score: priority.score,
      priority_label: priority.label,
      detected_pain_points: painPoints,
      next_action: "Review diagnostic and make first contact",
      next_followup_at: submission.created_at || new Date().toISOString()
    };
    const { data: lead, error: insertError } = await supabase.from("crm_leads").insert(payload).select("*, submissions(*)").single();
    if (insertError) throw insertError;
    tasks += await insertSequence(lead, templates, submission.created_at);
  }
  return { leads: missing.length, tasks };
}

export async function updateCrmLeadStatus({ leadId, status, notes, lostReason }) {
  const now = new Date().toISOString();
  const payload = { stage: status, status, updated_at: now };
  if (notes !== undefined) payload.notes = notes;
  if (lostReason !== undefined) payload.lost_reason = lostReason;
  if (["Won", "Lost"].includes(status)) payload.next_followup_at = null;
  const { error } = await supabase.from("crm_leads").update(payload).eq("id", leadId);
  if (error) throw error;
  if (["Won", "Lost"].includes(status)) {
    await supabase.from("crm_followup_tasks").update({ status: "Skipped", updated_at: now }).eq("lead_id", leadId).eq("status", "Pending");
  }
  await addCrmActivity({ leadId, type: "stage_changed", note: `Stage changed to ${status}` });
}

export async function addCrmActivity({ leadId, type, channel, outcome, note, taskId }) {
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const { error } = await supabase.from("crm_followup_events").insert({
    lead_id: leadId, task_id: taskId || null, event_type: type, channel: channel || null,
    outcome: outcome || null, note: note || null, occurred_at: now, actor_agent_id: user?.id || null
  });
  if (error) throw error;
  await supabase.from("crm_leads").update({ last_activity_at: now, updated_at: now }).eq("id", leadId);
}

export async function createCrmTask({ leadId, title, channel, dueAt, message }) {
  const { error } = await supabase.from("crm_followup_tasks").insert({
    lead_id: leadId, title, channel, due_at: dueAt, message: message || null, status: "Pending"
  });
  if (error) throw error;
  await supabase.from("crm_leads").update({ next_action: title, next_followup_at: dueAt, updated_at: new Date().toISOString() }).eq("id", leadId);
  await addCrmActivity({ leadId, type: "task_created", channel, note: title });
}

export async function completeCrmTask({ leadId, taskId, note, outcome = "Completed" }) {
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const { error } = await supabase.from("crm_followup_tasks").update({ status: "Completed", outcome, completed_at: now, completed_by_agent_id: user?.id || null, updated_at: now }).eq("id", taskId);
  if (error) throw error;
  const { data: currentLead } = await supabase.from("crm_leads").select("first_contacted_at").eq("id", leadId).maybeSingle();
  const { data: nextTask } = await supabase.from("crm_followup_tasks").select("title, due_at").eq("lead_id", leadId).eq("status", "Pending").order("due_at").limit(1).maybeSingle();
  await supabase.from("crm_leads").update({
    last_contacted_at: now, first_contacted_at: currentLead?.first_contacted_at || now, last_activity_at: now,
    next_action: nextTask?.title || null, next_followup_at: nextTask?.due_at || null, updated_at: now
  }).eq("id", leadId);
  await addCrmActivity({ leadId, taskId, type: "contacted", outcome, note: note || "Follow-up completed" });
}

export async function skipCrmTask({ leadId, taskId, note }) {
  const now = new Date().toISOString();
  const { error } = await supabase.from("crm_followup_tasks").update({ status: "Skipped", updated_at: now }).eq("id", taskId);
  if (error) throw error;
  await addCrmActivity({ leadId, taskId, type: "task_skipped", note: note || "Follow-up skipped" });
}

export async function rescheduleCrmTask({ leadId, taskId, dueAt }) {
  const { data: task } = await supabase.from("crm_followup_tasks").select("due_at, title").eq("id", taskId).single();
  const { error } = await supabase.from("crm_followup_tasks").update({ due_at: dueAt, rescheduled_from: task?.due_at, updated_at: new Date().toISOString() }).eq("id", taskId);
  if (error) throw error;
  await supabase.from("crm_leads").update({ next_action: task?.title, next_followup_at: dueAt, updated_at: new Date().toISOString() }).eq("id", leadId);
  await addCrmActivity({ leadId, taskId, type: "task_rescheduled", note: `Rescheduled to ${new Date(dueAt).toLocaleString()}` });
}
