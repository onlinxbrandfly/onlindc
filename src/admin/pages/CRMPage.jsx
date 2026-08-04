import React, { useMemo, useState } from "react";
import CRMFilters from "../components/CRMFilters";
import CRMFollowupTasks from "../components/CRMFollowupTasks";
import CRMLeadForm from "../components/CRMLeadForm";
import CRMLeadModal from "../components/CRMLeadModal";
import CRMLeadTable from "../components/CRMLeadTable";
import CRMPipeline from "../components/CRMPipeline";
import {
  addCrmActivity, completeCrmTask, createCrmTask, leadContact, rescheduleCrmTask,
  saveCrmLead, skipCrmTask, syncCrmFromSubmissions, updateCrmLeadStatus
} from "../services/crmService";

const EMPTY_FILTERS = { search: "", stage: "", source: "", priority: "" };

export default function CRMPage({ data, reload }) {
  const [view, setView] = useState("today");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const sortedLeads = useMemo(() => [...(data.crmLeads || [])].sort((a, b) => Number(b.priority_score || 0) - Number(a.priority_score || 0) || new Date(b.created_at) - new Date(a.created_at)), [data.crmLeads]);
  const filteredLeads = useMemo(() => sortedLeads.filter((lead) => {
    const contact = leadContact(lead);
    const haystack = `${contact.businessName} ${contact.contactName} ${contact.phone} ${contact.email}`.toLowerCase();
    return (!filters.search || haystack.includes(filters.search.toLowerCase())) &&
      (!filters.stage || (lead.stage || lead.status) === filters.stage) &&
      (!filters.source || lead.source === filters.source) &&
      (!filters.priority || lead.priority_label === filters.priority);
  }), [sortedLeads, filters]);
  const pending = (data.crmTasks || []).filter((task) => task.status === "Pending");
  const overdue = pending.filter((task) => new Date(task.due_at) < new Date());
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const dueToday = pending.filter((task) => new Date(task.due_at) <= todayEnd);

  async function refreshAndClose() {
    await reload();
    setSelectedLead(null);
  }

  async function syncLeads() {
    setBusy(true);
    try {
      const result = await syncCrmFromSubmissions({ submissions: data.submissions, answers: data.answers, templates: data.crmTemplates });
      alert(result.leads ? `${result.leads} diagnostic lead(s) added with ${result.tasks} follow-ups.` : "All diagnostic leads are already in CRM.");
      await reload();
    } catch (error) { alert(error.message || "Could not sync diagnostic leads."); }
    finally { setBusy(false); }
  }

  async function saveLead(values, leadId) {
    try {
      await saveCrmLead({ values, leadId, templates: data.crmTemplates, createPlan: values.createPlan });
      setShowLeadForm(false); setEditingLead(null); setSelectedLead(null);
      await reload(); alert(leadId ? "Lead updated." : "Lead added to CRM.");
    } catch (error) { alert(error.message || "Could not save lead."); throw error; }
  }

  async function changeStatus(lead, status) {
    let lostReason;
    if (status === "Lost") {
      lostReason = window.prompt("Why was this lead lost?", lead.lost_reason || "");
      if (lostReason === null) return;
    }
    try { await updateCrmLeadStatus({ leadId: lead.id, status, lostReason }); await refreshAndClose(); }
    catch (error) { alert(error.message || "Could not move lead."); }
  }

  async function complete(task) {
    const outcome = window.prompt("Outcome (optional)", "Connected") ?? "Completed";
    try { await completeCrmTask({ leadId: task.lead_id, taskId: task.id, outcome }); await refreshAndClose(); }
    catch (error) { alert(error.message || "Could not complete follow-up."); }
  }

  async function skip(task) {
    if (!window.confirm("Skip this follow-up?")) return;
    try { await skipCrmTask({ leadId: task.lead_id, taskId: task.id }); await refreshAndClose(); }
    catch (error) { alert(error.message || "Could not skip follow-up."); }
  }

  async function reschedule(task) {
    const date = window.prompt("New date and time (YYYY-MM-DD HH:MM)", new Date(Date.now() + 86400000).toISOString().slice(0, 16).replace("T", " "));
    if (!date) return;
    const dueAt = new Date(date);
    if (Number.isNaN(dueAt.getTime())) return alert("Please enter a valid date and time.");
    try { await rescheduleCrmTask({ leadId: task.lead_id, taskId: task.id, dueAt: dueAt.toISOString() }); await refreshAndClose(); }
    catch (error) { alert(error.message || "Could not reschedule follow-up."); }
  }

  return <>
    <div className="pageHead"><div><h1>CRM</h1><p className="muted">Know who to contact, what to discuss, and when to follow up.</p></div><div className="rowActions"><button className="btn" onClick={syncLeads} disabled={busy}>{busy ? "Checking..." : "Bring in diagnostics"}</button><button className="btn primary" onClick={() => { setEditingLead(null); setShowLeadForm(true); }}>Add lead</button></div></div>

    <div className="crmSummary">
      <button onClick={() => setView("today")}><b>{dueToday.length}</b><span>Due today</span></button>
      <button onClick={() => setView("today")} className={overdue.length ? "danger" : ""}><b>{overdue.length}</b><span>Overdue</span></button>
      <button onClick={() => { setFilters({ ...EMPTY_FILTERS, priority: "High Priority" }); setView("leads"); }}><b>{sortedLeads.filter((lead) => lead.priority_label === "High Priority").length}</b><span>High priority</span></button>
      <button onClick={() => setView("pipeline")}><b>{sortedLeads.filter((lead) => ["Demo Scheduled", "Proposal Sent"].includes(lead.stage || lead.status)).length}</b><span>Active deals</span></button>
      <button onClick={() => setView("pipeline")}><b>{sortedLeads.filter((lead) => (lead.stage || lead.status) === "Won").length}</b><span>Won</span></button>
    </div>

    <nav className="crmViewTabs" aria-label="CRM views"><button className={view === "today" ? "active" : ""} onClick={() => setView("today")}>Today</button><button className={view === "leads" ? "active" : ""} onClick={() => setView("leads")}>Leads</button><button className={view === "pipeline" ? "active" : ""} onClick={() => setView("pipeline")}>Pipeline</button></nav>

    {view === "today" && <CRMFollowupTasks tasks={data.crmTasks || []} leads={sortedLeads} onComplete={complete} onSkip={skip} onReschedule={reschedule} />}
    {view === "leads" && <><CRMFilters filters={filters} onChange={setFilters} /><CRMLeadTable leads={filteredLeads} tasks={data.crmTasks || []} onOpen={setSelectedLead} /></>}
    {view === "pipeline" && <CRMPipeline leads={filteredLeads} onOpen={setSelectedLead} onMove={changeStatus} />}

    {showLeadForm && <CRMLeadForm lead={editingLead} leads={sortedLeads} industries={data.industries || []} onClose={() => { setShowLeadForm(false); setEditingLead(null); }} onSave={saveLead} />}
    {selectedLead && <CRMLeadModal lead={selectedLead} tasks={data.crmTasks || []} events={data.crmEvents || []} onClose={() => setSelectedLead(null)} onEdit={(lead) => { setEditingLead(lead); setSelectedLead(null); setShowLeadForm(true); }} onStatusChange={changeStatus} onComplete={complete} onSkip={skip} onReschedule={reschedule} onAddActivity={async (activity) => { try { await addCrmActivity({ leadId: selectedLead.id, type: "activity", ...activity }); await refreshAndClose(); } catch (error) { alert(error.message); } }} onCreateTask={async (task) => { try { await createCrmTask({ leadId: selectedLead.id, ...task }); await refreshAndClose(); } catch (error) { alert(error.message); } }} />}
  </>;
}
