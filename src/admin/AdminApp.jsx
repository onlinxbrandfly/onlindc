import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import useAdminData from "./hooks/useAdminData";
import SubmissionModal from "./components/SubmissionModal";
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
      <aside className="sidebar">
        <div className="brandMark white">Onlin.in</div>
        <button className={tab==="overview" ? "active" : ""} onClick={() => setTab("overview")}>Dashboard</button>
        <button className={tab==="crm" ? "active" : ""} onClick={() => setTab("crm")}>CRM</button>
        <button className={tab==="submissions" ? "active" : ""} onClick={() => setTab("submissions")}>Submissions</button>
        <button className={tab==="builder" ? "active" : ""} onClick={() => setTab("builder")}>Form Builder</button>
        <button className={tab==="knowledge" ? "active" : ""} onClick={() => setTab("knowledge")}>Knowledge Centre</button>
        <button className={tab==="industries" ? "active" : ""} onClick={() => setTab("industries")}>Industries</button>
        <button onClick={logout}>Logout</button>
      </aside>

      <main className="adminMain">
        {loading ? <h2>Loading...</h2> : (
          <>
            {tab === "overview" && <DashboardPage data={data} />}
            {tab === "crm" && <CRMPage data={data} reload={reload} />}
            {tab === "submissions" && <SubmissionsPage submissions={data.submissions} answers={data.answers} onView={setSelectedSubmission} />}
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
    </div>
  );
}
