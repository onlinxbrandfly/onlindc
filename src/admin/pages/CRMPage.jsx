import React, { useMemo, useState } from "react";
import CRMLeadTable from "../components/CRMLeadTable";
import CRMFollowupTasks from "../components/CRMFollowupTasks";
import CRMLeadModal from "../components/CRMLeadModal";
import {
  completeCrmTask,
  skipCrmTask,
  syncCrmFromSubmissions,
  updateCrmLeadStatus
} from "../services/crmService";

export default function CRMPage({ data, reload }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [busy, setBusy] = useState(false);

  const leads = useMemo(() => {
    return [...(data.crmLeads || [])].sort((a, b) => {
      const priorityDiff = Number(b.priority_score || 0) - Number(a.priority_score || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [data.crmLeads]);

  async function syncLeads() {
    setBusy(true);
    try {
      const result = await syncCrmFromSubmissions({
        submissions: data.submissions,
        answers: data.answers,
        templates: data.crmTemplates
      });
      alert(`CRM synced: ${result.leads} leads and ${result.tasks} tasks created.`);
      await reload();
    } catch (error) {
      alert(error.message || "Could not sync CRM. Please run supabase/crm_phase1.sql first.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(lead, status, notes) {
    try {
      await updateCrmLeadStatus({ leadId: lead.id, status, notes });
      await reload();
      setSelectedLead(selectedLead ? { ...lead, status, notes: notes ?? lead.notes } : null);
    } catch (error) {
      alert(error.message || "Could not update lead.");
    }
  }

  async function completeTask(task) {
    try {
      await completeCrmTask({ leadId: task.lead_id, taskId: task.id });
      await reload();
    } catch (error) {
      alert(error.message || "Could not complete task.");
    }
  }

  async function skipTask(task) {
    try {
      await skipCrmTask({ leadId: task.lead_id, taskId: task.id });
      await reload();
    } catch (error) {
      alert(error.message || "Could not skip task.");
    }
  }

  const pendingTasks = (data.crmTasks || []).filter(task => task.status === "Pending");
  const overdueTasks = pendingTasks.filter(task => new Date(task.due_at).getTime() < Date.now());

  return (
    <>
      <div className="pageHead">
        <div>
          <h1>CRM</h1>
          <p className="muted">Manual follow-up engine based on score, pain points and useful spacing.</p>
        </div>
        <button className="btn primary" onClick={syncLeads} disabled={busy}>
          {busy ? "Syncing..." : "Sync Submissions"}
        </button>
      </div>

      <div className="kpiGrid">
        <div className="kpi"><b>{leads.length}</b><span>CRM Leads</span></div>
        <div className="kpi"><b>{leads.filter(l => l.priority_label === "High Need").length}</b><span>High Need</span></div>
        <div className="kpi"><b>{pendingTasks.length}</b><span>Pending Follow-ups</span></div>
        <div className="kpi"><b>{overdueTasks.length}</b><span>Overdue</span></div>
        <div className="kpi"><b>{leads.filter(l => l.status === "Demo Booked").length}</b><span>Demo Booked</span></div>
        <div className="kpi"><b>{leads.filter(l => l.status === "Won").length}</b><span>Won</span></div>
      </div>

      <CRMFollowupTasks
        tasks={data.crmTasks || []}
        leads={leads}
        onComplete={completeTask}
        onSkip={skipTask}
      />

      <CRMLeadTable
        leads={leads}
        tasks={data.crmTasks || []}
        onOpen={setSelectedLead}
        onStatusChange={changeStatus}
      />

      {selectedLead && (
        <CRMLeadModal
          lead={selectedLead}
          tasks={data.crmTasks || []}
          events={data.crmEvents || []}
          onClose={() => setSelectedLead(null)}
          onStatusChange={changeStatus}
          onComplete={completeTask}
          onSkip={skipTask}
        />
      )}
    </>
  );
}
