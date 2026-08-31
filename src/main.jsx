import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./services/supabase";
import "./styles/global.css";
import PublicDiagnostic from "./public/PublicDiagnostic";
import AdminLogin from "./admin/AdminLogin";
import AdminApp from "./admin/AdminApp";
import AdminResetPassword from "./admin/AdminResetPassword";
import ReportPage from "./report/ReportPage";

function App(){
  const [route, setRoute] = useState(window.location.pathname);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      window.removeEventListener("popstate", onPop);
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || !route.startsWith("/admin") || route === "/admin/login" || route === "/admin/reset-password") return undefined;

    const keepAdminOpen = () => {
      const backEvent = new CustomEvent("admin-app-back", { cancelable: true });
      window.dispatchEvent(backEvent);
      window.history.pushState({ adminApp: true }, "", "/admin");
      setRoute("/admin");
    };

    window.history.replaceState({ ...window.history.state, adminApp: true }, "", "/admin");
    window.history.pushState({ adminApp: true }, "", "/admin");
    window.addEventListener("popstate", keepAdminOpen);
    return () => window.removeEventListener("popstate", keepAdminOpen);
  }, [session, route]);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  };

  if(route.startsWith("/report/")){
    const slug = route.replace("/report/", "");
    return <ReportPage slug={slug} />;
  }

  if(route.startsWith("/admin")){
    if(route === "/admin/reset-password") return <AdminResetPassword navigate={navigate} />;
    if(route === "/admin/login") return <AdminLogin navigate={navigate} />;
    return session ? <AdminApp navigate={navigate} /> : <AdminLogin navigate={navigate} />;
  }

  return <PublicDiagnostic />;
}

createRoot(document.getElementById("root")).render(<App />);
