import Papa from "papaparse";
import readXlsxFile from "read-excel-file/browser";
import { CRM_SOURCES, CRM_STAGES, normalizePhone } from "./crmService";

const TEMPLATE_HEADERS = [
  "Business Name", "Contact Person", "Mobile Number", "Email", "City", "Industry",
  "Lead Source", "Source Details", "Problems", "Problem Notes", "Requirements",
  "Expected Value", "Assigned Agent", "Next Action", "Follow-up Date"
];

const HEADER_ALIASES = {
  businessname: "business_name", brandname: "business_name", company: "business_name",
  contactperson: "contact_name", contactname: "contact_name", owner: "contact_name", ownername: "contact_name",
  mobilenumber: "phone", mobile: "phone", phone: "phone", phonenumber: "phone",
  email: "email", emailaddress: "email", city: "city", location: "city",
  industry: "industry", category: "industry", leadsource: "source", source: "source",
  sourcedetails: "source_detail", campaign: "source_detail", problems: "detected_pain_points",
  painpoints: "detected_pain_points", problemnotes: "problem_notes", requirements: "requirements",
  needs: "requirements", expectedvalue: "estimated_value", estimatedvalue: "estimated_value",
  assignedagent: "assigned_agent", assignedto: "assigned_agent", salesperson: "assigned_agent",
  nextaction: "next_action", followupdate: "next_followup_at", nextfollowup: "next_followup_at",
  stage: "stage", temperature: "temperature", interestlevel: "temperature", notes: "notes"
};

function headerKey(value) {
  return HEADER_ALIASES[String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "")] || "";
}

function rowsToObjects(rows) {
  const headers = (rows[0] || []).map(headerKey);
  return rows.slice(1).filter((row) => row.some((cell) => String(cell ?? "").trim())).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]]).filter(([header]) => header))
  );
}

async function rawRows(file) {
  if (/\.xlsx$/i.test(file.name)) return rowsToObjects(await readXlsxFile(file));
  const parsed = Papa.parse(await file.text(), { header: true, skipEmptyLines: "greedy", transformHeader: headerKey });
  if (parsed.errors.length) throw new Error(parsed.errors[0].message || "Could not read this CSV file.");
  return parsed.data;
}

function text(value) { return String(value ?? "").trim(); }
function lookup(items, value, fields) {
  const target = text(value).toLowerCase();
  return target ? items.find((item) => fields.some((field) => text(item[field]).toLowerCase() === target)) : null;
}

function dateValue(value) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : typeof value === "number" ? new Date(Date.UTC(1899, 11, 30) + value * 86400000) : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export async function parseLeadFile(file, { industries = [], agents = [], existingLeads = [] }) {
  if (!/\.(csv|xlsx)$/i.test(file.name)) throw new Error("Upload a CSV or XLSX file.");
  const sourceRows = await rawRows(file);
  if (!sourceRows.length) throw new Error("This file does not contain any lead rows.");
  const seen = new Set();

  return sourceRows.map((row, index) => {
    const industry = lookup(industries, row.industry, ["name", "slug"]);
    const agent = lookup(agents, row.assigned_agent, ["full_name", "email"]);
    const phone = normalizePhone(row.phone);
    const email = text(row.email).toLowerCase();
    const fingerprint = phone ? `p:${phone}` : email ? `e:${email}` : "";
    const existing = existingLeads.find((lead) => (phone && normalizePhone(lead.phone || lead.submissions?.phone) === phone) || (email && text(lead.email || lead.submissions?.email).toLowerCase() === email));
    const errors = [];
    if (!text(row.business_name)) errors.push("Business name is required");
    if (!phone && !email) errors.push("Mobile number or email is required");
    if (text(row.phone) && phone.length !== 10) errors.push("Mobile number must contain 10 digits");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email is invalid");
    if (text(row.industry) && !industry) errors.push(`Industry '${text(row.industry)}' was not found`);
    if (text(row.assigned_agent) && !agent) errors.push(`Agent '${text(row.assigned_agent)}' was not found`);
    if (fingerprint && seen.has(fingerprint)) errors.push("Duplicate row in this file");
    if (fingerprint) seen.add(fingerprint);

    const source = CRM_SOURCES.includes(text(row.source)) ? text(row.source) : text(row.source) ? "Other" : "Bulk Import";
    const stage = CRM_STAGES.includes(text(row.stage)) ? text(row.stage) : "New";
    const followup = dateValue(row.next_followup_at);
    if (row.next_followup_at && !followup) errors.push("Follow-up date is invalid");

    return {
      rowNumber: index + 2,
      errors,
      duplicate: existing || null,
      provided: [...new Set(Object.keys(row).filter((key) => text(row[key])).map((key) => key === "industry" ? "industry_id" : key === "assigned_agent" ? "assigned_agent_id" : key))],
      values: {
        business_name: text(row.business_name), contact_name: text(row.contact_name), phone: text(row.phone), email,
        city: text(row.city), industry_id: industry?.id || "", source, source_detail: text(row.source_detail) || (source === "Other" ? text(row.source) : ""),
        stage, temperature: ["Hot", "Warm", "Cold"].includes(text(row.temperature)) ? text(row.temperature) : "Warm",
        detected_pain_points: text(row.detected_pain_points).split(/[|;,]/).map((item) => item.trim()).filter(Boolean),
        problem_notes: text(row.problem_notes), requirements: text(row.requirements), notes: text(row.notes),
        estimated_value: text(row.estimated_value).replace(/[^0-9.]/g, ""), assigned_agent_id: agent?.id || "",
        next_action: text(row.next_action) || "Make first contact", next_followup_at: followup || new Date().toISOString()
      }
    };
  });
}

export function downloadLeadTemplate() {
  const sample = ["Example Jewellers", "Amit Jain", "9876543210", "amit@example.com", "Jaipur", "Jewellery", "Cold Call", "Market list", "Manual catalogue | Slow follow-up", "Uses WhatsApp for every enquiry", "Structured catalogue", "100000", "", "Call and qualify", "2026-09-02 11:00"];
  const csv = Papa.unparse([TEMPLATE_HEADERS, sample]);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = "onlindc-lead-import-template.csv"; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
