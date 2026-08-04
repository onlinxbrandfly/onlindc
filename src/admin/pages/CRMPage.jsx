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
import { Plus, RefreshCw, X } from "lucide-react";

const EMPTY_FILTERS = { search: "", stage: "", source: "", priority: "" };

export default function CRMPage({ data, reload, notify = () => {} }) {
  const [view, setView] = useState("today");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null);

  const sortedLeads = useMemo(() => [...(data.crmLeads || [])].sort((a, b) => Number(b.priority_score || 0) - Number(a.priority_score || 0) || new Date(b.created_at) - new Date(a.created_at)), [data.crmLeads]);
  const filteredLeads = useMemo(() => sortedLeads.filter((lead) => {
    const contact = leadContact(lead);
    const haystack = `${contact.businessName} ${contact.contactName} ${contact.phone} ${contact.email}`.toLowerCase();
    return (!filters.search || haystack.includes(filters.search.toLowerCase())) &&
      (!filters.stage || (lead.stage || lead.status) === filters.stage) &&
      (!filters.source || lead.source === filters.source) &&
      (!filters.priority || lead.priority_label === filters.priority);
  }), [sortedLeads, filters]);
  const nextTaskByLead = new Map();
  (data.crmTasks || []).filter((task) => task.status === "Pending").sort((a, b) => new Date(a.due_at) - new Date(b.due_at)).forEach((task) => {
    if (!nextTaskByLead.has(task.lead_id)) nextTaskByLead.set(task.lead_id, task);
  });
  const pending = [...nextTaskByLead.values()];
  const overdue = pending.filter((task) => new Date(task.due_at) < new Date());
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const dueToday = pending.filter((task) => new Date(task.due_at) >= todayStart && new Date(task.due_at) <= todayEnd);

  async function refreshAndClose() {
    await reload();
    setSelectedLead(null);
  }

  async function syncLeads() {
    setBusy(true);
    try {
      const result = await syncCrmFromSubmissions({ submissions: data.submissions, answers: data.answers, templates: data.crmTemplates });
      notify(result.leads ? `${result.leads} diagnostic lead(s) added.` : "Diagnostic leads are already up to date.");
      await reload();
    } catch (error) { notify(error.message || "Could not sync diagnostic leads."); }
    finally { setBusy(false); }
  }

  async function saveLead(values, leadId) {
    try {
      await saveCrmLead({ values, leadId, templates: data.crmTemplates, createPlan: values.createPlan });
      setShowLeadForm(false); setEditingLead(null); setSelectedLead(null);
      await reload(); notify(leadId ? "Lead updated." : "Lead added to CRM.");
    } catch (error) { notify(error.message || "Could not save lead."); throw error; }
  }

  async function changeStatus(lead, status) {
    if (status === "Lost") {
      setDialog({ type: "lost", lead, status, value: lead.lost_reason || "" });
      return;
    }
    try { await updateCrmLeadStatus({ leadId: lead.id, status }); await refreshAndClose(); notify(`Lead moved to ${status}.`); }
    catch (error) { notify(error.message || "Could not move lead."); }
  }

  async function complete(task) {
    setDialog({ type: "complete", task, value: "Connected" });
  }

  async function skip(task) {
    setDialog({ type: "skip", task });
  }

  async function reschedule(task) {
    const date = new Date(Date.now() + 86400000); date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setDialog({ type: "reschedule", task, value: date.toISOString().slice(0, 16) });
  }

  async function submitDialog(event) {
    event.preventDefault();
    try {
      if (dialog.type === "complete") await completeCrmTask({ leadId: dialog.task.lead_id, taskId: dialog.task.id, outcome: dialog.value || "Completed" });
      if (dialog.type === "skip") await skipCrmTask({ leadId: dialog.task.lead_id, taskId: dialog.task.id });
      if (dialog.type === "reschedule") await rescheduleCrmTask({ leadId: dialog.task.lead_id, taskId: dialog.task.id, dueAt: new Date(dialog.value).toISOString() });
      if (dialog.type === "lost") await updateCrmLeadStatus({ leadId: dialog.lead.id, status: "Lost", lostReason: dialog.value });
      const message = dialog.type === "complete" ? "Follow-up completed." : dialog.type === "reschedule" ? "Follow-up rescheduled." : dialog.type === "lost" ? "Lead marked as lost." : "Follow-up skipped.";
      setDialog(null); await refreshAndClose(); notify(message);
    } catch (error) { notify(error.message || "Could not complete this action."); }
  }

  return <>
    <div className="pageHead crmPageHead"><div><span className="pageEyebrow">Sales workspace</span><h1>CRM</h1><p className="muted">Your next best actions, in one place.</p></div><div className="rowActions"><button className="btn iconTextButton" onClick={syncLeads} disabled={busy}><RefreshCw size={18} />{busy ? "Checking..." : "Sync"}</button><button className="btn primary iconTextButton" onClick={() => { setEditingLead(null); setShowLeadForm(true); }}><Plus size={19} />Add lead</button></div></div>

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
    {selectedLead && <CRMLeadModal lead={selectedLead} tasks={data.crmTasks || []} events={data.crmEvents || []} onClose={() => setSelectedLead(null)} onEdit={(lead) => { setEditingLead(lead); setSelectedLead(null); setShowLeadForm(true); }} onStatusChange={changeStatus} onComplete={complete} onSkip={skip} onReschedule={reschedule} onAddActivity={async (activity) => { try { await addCrmActivity({ leadId: selectedLead.id, type: "activity", ...activity }); await refreshAndClose(); notify("Activity added."); } catch (error) { notify(error.message || "Could not add activity."); } }} onCreateTask={async (task) => { try { await createCrmTask({ leadId: selectedLead.id, ...task }); await refreshAndClose(); notify("Follow-up added."); } catch (error) { notify(error.message || "Could not add follow-up."); } }} />}
    {dialog && <div className="appSheetBackdrop"><form className="appSheet crmActionSheet" onSubmit={submitDialog}><div className="appSheetHandle"/><header><h2>{dialog.type === "complete" ? "Complete follow-up" : dialog.type === "reschedule" ? "Choose a new time" : dialog.type === "lost" ? "Mark lead as lost" : "Skip follow-up?"}</h2><button type="button" aria-label="Close" onClick={() => setDialog(null)}><X size={21}/></button></header>{dialog.type === "complete" && <label><span>Outcome</span><select value={dialog.value} onChange={(event) => setDialog({ ...dialog, value: event.target.value })}><option>Connected</option><option>No answer</option><option>Interested</option><option>Demo requested</option><option>Not interested</option></select></label>}{dialog.type === "reschedule" && <label><span>Follow up on</span><input type="datetime-local" required value={dialog.value} onChange={(event) => setDialog({ ...dialog, value: event.target.value })}/></label>}{dialog.type === "lost" && <label><span>Reason</span><textarea required value={dialog.value} onChange={(event) => setDialog({ ...dialog, value: event.target.value })} placeholder="What happened?"/></label>}{dialog.type === "skip" && <p>This removes the task from Today but keeps it in the lead history.</p>}<div className="modalActions"><button type="button" className="btn" onClick={() => setDialog(null)}>Cancel</button><button className="btn primary">Confirm</button></div></form></div>}
  </>;
}
