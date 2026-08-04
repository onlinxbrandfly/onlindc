import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import useAdminData from "./hooks/useAdminData";
import SubmissionModal from "./components/SubmissionModal";
import AdminNavigation from "./components/AdminNavigation";
import AdminToast from "./components/AdminToast";
import AdminAppTools from "./components/AdminAppTools";
import {
  DashboardPage,
  SubmissionsPage,
  FormBuilderPage,
  KnowledgePage,
  IndustriesPage,
  CRMPage
} from "./pages";

export default function AdminApp({ navigate }){
  const [tab, setTab] = useState(localStorage.getItem("admin-tab") || "overview");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [toast, setToast] = useState("");
  const { data, loading, reload } = useAdminData();

  useEffect(() => {
    localStorage.setItem("admin-tab", tab);
  }, [tab]);

  async function logout(){
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <div className="adminLayout">
      <AdminNavigation tab={tab} onTabChange={setTab} onLogout={logout} />

      <main className="adminMain">
        {loading ? <h2>Loading...</h2> : (
          <>
            {tab === "overview" && <DashboardPage data={data} onNavigate={setTab} />}
            {tab === "crm" && <CRMPage data={data} reload={reload} notify={setToast} />}
            {tab === "submissions" && <SubmissionsPage submissions={data.submissions} answers={data.answers} onView={setSelectedSubmission} notify={setToast} />}
            {tab === "builder" && <FormBuilderPage data={data} reload={reload} />}
            {tab === "knowledge" && <KnowledgePage data={data} reload={reload} />}
            {tab === "industries" && <IndustriesPage industries={data.industries} reload={reload} />}
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
