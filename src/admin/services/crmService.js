import { supabase } from "../../services/supabase";

const FOLLOWUP_SEQUENCE = [
  { day: 0, title: "Report delivery" },
  { day: 2, title: "Problem-specific help" },
  { day: 5, title: "Similar business example" },
  { day: 9, title: "Feature education" },
  { day: 15, title: "Soft demo invite" },
  { day: 30, title: "Nurture check-in" }
];

export function crmReportUrl(submission) {
  if (submission?.report_url) return submission.report_url;
  if (submission?.report_slug) return `${window.location.origin}/report/${submission.report_slug}`;
  return `${window.location.origin}/report/${submission?.id || ""}`;
}

export function crmWhatsappLink({ lead, task }) {
  const submission = lead?.submissions || lead?.submission || {};
  const phone = String(submission.phone || "").replace(/\D/g, "").slice(-10);
  if (!phone) return "#";
  return `https://wa.me/91${phone}?text=${encodeURIComponent(task?.message || "")}`;
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

function phoneAvailable(submission) {
  return String(submission.phone || "").replace(/\D/g, "").length >= 8;
}

function priorityFor(submission, painPoints) {
  const score = Number(submission.score_percentage || 0);
  const needScore = Math.max(0, 100 - score);
  const phoneBoost = phoneAvailable(submission) ? 15 : 0;
  const painBoost = Math.min(20, (painPoints || []).length * 5);
  const total = Math.round(needScore + phoneBoost + painBoost);

  if (score < 42) return { score: total, label: "High Need" };
  if (score < 62) return { score: total, label: "Strong Onlin Fit" };
  if (score < 80) return { score: total, label: "Growth Opportunity" };
  return { score: total, label: "Advanced Opportunity" };
}

function fillTemplate(template, submission, painPoints) {
  const painPoint = painPoints?.[0] || "manual business gaps";
  return String(template || "")
    .replaceAll("{{owner_name}}", submission.owner_name || "there")
    .replaceAll("{{business_name}}", submission.business_name || "your business")
    .replaceAll("{{report_url}}", crmReportUrl(submission))
    .replaceAll("{{pain_point}}", painPoint);
}

function fallbackMessage(title, submission, painPoints) {
  const painPoint = painPoints?.[0] || "manual workflows";
  const map = {
    "Report delivery": `Hello ${submission.owner_name || ""}, your Onlin Business Diagnostic Report is ready: ${crmReportUrl(submission)}`,
    "Problem-specific help": `Your report shows ${painPoint}. Onlin can help reduce this with a more structured digital commerce flow.`,
    "Similar business example": `A similar business can improve product discovery with a clear online catalogue/store. Want me to show this for ${submission.business_name || "your business"}?`,
    "Feature education": "One useful Onlin feature for your current stage is a structured product catalogue/storefront so customers can browse without repeated manual follow-up.",
    "Soft demo invite": `Would you like a quick demo showing how Onlin can work for ${submission.business_name || "your business"} specifically?`,
    "Nurture check-in": "Checking in with one practical idea: organize your products into clear collections and share one catalogue link instead of sending photos repeatedly."
  };
  return map[title] || map["Report delivery"];
}

export async function syncCrmFromSubmissions({ submissions, answers, templates }) {
  const { data: existingRows, error: existingError } = await supabase
    .from("crm_leads")
    .select("id, submission_id");

  if (existingError) throw existingError;

  const existingSubmissionIds = new Set((existingRows || []).map((lead) => lead.submission_id));
  const missingSubmissions = (submissions || []).filter((submission) => !existingSubmissionIds.has(submission.id));

  if (!missingSubmissions.length) return { leads: 0, tasks: 0 };

  const leadRows = missingSubmissions.map((submission) => {
    const painPoints = getPainPoints(answers, submission.id);
    const priority = priorityFor(submission, painPoints);
    return {
      submission_id: submission.id,
      industry_id: submission.industry_id,
      status: "New",
      priority_score: priority.score,
      priority_label: priority.label,
      detected_pain_points: painPoints,
      next_followup_at: addDays(submission.created_at, 0)
    };
  });

  const { data: newLeads, error: insertError } = await supabase
    .from("crm_leads")
    .insert(leadRows)
    .select("*");

  if (insertError) throw insertError;

  const templateByTitle = new Map((templates || []).map((template) => [template.title, template]));
  const taskRows = [];

  for (const lead of newLeads || []) {
    const submission = missingSubmissions.find((item) => item.id === lead.submission_id);
    const painPoints = getPainPoints(answers, lead.submission_id);

    FOLLOWUP_SEQUENCE.forEach((step) => {
      const template = templateByTitle.get(step.title);
      taskRows.push({
        lead_id: lead.id,
        template_id: template?.id || null,
        sequence_day: step.day,
        title: step.title,
        channel: template?.channel || "whatsapp",
        due_at: addDays(submission.created_at, step.day),
        status: "Pending",
        message: template?.message ? fillTemplate(template.message, submission, painPoints) : fallbackMessage(step.title, submission, painPoints),
        creative_url: template?.creative_url || null,
        video_url: template?.video_url || null
      });
    });
  }

  if (!taskRows.length) return { leads: newLeads.length, tasks: 0 };

  const { error: taskError } = await supabase
    .from("crm_followup_tasks")
    .insert(taskRows);

  if (taskError) throw taskError;

  return { leads: newLeads.length, tasks: taskRows.length };
}

export async function updateCrmLeadStatus({ leadId, status, notes }) {
  const payload = {
    status,
    updated_at: new Date().toISOString()
  };

  if (notes !== undefined) payload.notes = notes;

  const { error } = await supabase
    .from("crm_leads")
    .update(payload)
    .eq("id", leadId);

  if (error) throw error;

  await supabase.from("crm_followup_events").insert({
    lead_id: leadId,
    event_type: "status_updated",
    note: `Status changed to ${status}`
  });
}

export async function completeCrmTask({ leadId, taskId, note }) {
  const now = new Date().toISOString();
  const { error: taskError } = await supabase
    .from("crm_followup_tasks")
    .update({
      status: "Completed",
      completed_at: now,
      updated_at: now
    })
    .eq("id", taskId);

  if (taskError) throw taskError;

  await supabase
    .from("crm_leads")
    .update({
      last_contacted_at: now,
      updated_at: now
    })
    .eq("id", leadId);

  await supabase.from("crm_followup_events").insert({
    lead_id: leadId,
    task_id: taskId,
    event_type: "contacted",
    note: note || "Follow-up marked completed"
  });
}

export async function skipCrmTask({ leadId, taskId, note }) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("crm_followup_tasks")
    .update({
      status: "Skipped",
      updated_at: now
    })
    .eq("id", taskId);

  if (error) throw error;

  await supabase.from("crm_followup_events").insert({
    lead_id: leadId,
    task_id: taskId,
    event_type: "skipped",
    note: note || "Follow-up skipped"
  });
}
