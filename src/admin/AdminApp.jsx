import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import useAdminData from "./hooks/useAdminData";
import SubmissionModal from "./components/SubmissionModal";
import AdminNavigation from "./components/AdminNavigation";
import AdminToast from "./components/AdminToast";
import AdminAppTools from "./components/AdminAppTools";
import { loadCurrentAgent } from "./services/agentService";
import {
  DashboardPage,
  SubmissionsPage,
  FormBuilderPage,
  KnowledgePage,
  IndustriesPage,
  CRMPage,
  TeamPage
} from "./pages";

export default function AdminApp({ navigate }){
  const [tab, setTab] = useState(localStorage.getItem("admin-tab") || "overview");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [toast, setToast] = useState("");
  const [currentAgent, setCurrentAgent] = useState(null);
  const { data, loading, reload } = useAdminData();

  useEffect(() => {
    localStorage.setItem("admin-tab", tab);
  }, [tab]);

  useEffect(() => { loadCurrentAgent().then(setCurrentAgent).catch((error) => setToast(error.message)); }, []);
  const canManage = ["admin", "manager"].includes(currentAgent?.role);

  useEffect(() => {
    if (currentAgent && !canManage && !["overview", "crm"].includes(tab)) setTab("overview");
  }, [currentAgent, canManage, tab]);

  async function logout(){
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <div className="adminLayout">
      <AdminNavigation tab={tab} onTabChange={setTab} onLogout={logout} currentAgent={currentAgent} />

      <main className="adminMain">
        {loading ? <h2>Loading...</h2> : (
          <>
            {tab === "overview" && <DashboardPage data={data} onNavigate={setTab} currentAgent={currentAgent} />}
            {tab === "crm" && <CRMPage data={data} reload={reload} notify={setToast} currentAgent={currentAgent} />}
            {canManage && tab === "team" && <TeamPage data={data} reload={reload} notify={setToast} />}
            {canManage && tab === "submissions" && <SubmissionsPage submissions={data.submissions} answers={data.answers} onView={setSelectedSubmission} notify={setToast} />}
            {canManage && tab === "builder" && <FormBuilderPage data={data} reload={reload} />}
            {canManage && tab === "knowledge" && <KnowledgePage data={data} reload={reload} />}
            {canManage && tab === "industries" && <IndustriesPage industries={data.industries} reload={reload} />}
          </>
        )}
      </main>

      {selectedSubmission && (
        <SubmissionModal
          submission={selectedSubmission}
          answers={data.answers.filter(a => a.submission_id === selectedSubmission.id)}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
      <AdminToast message={toast} onClose={() => setToast("")} />
      <AdminAppTools notify={setToast} />
    </div>
  );
}
