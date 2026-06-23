import React, { useState } from "react";
import { supabase } from "../services/supabase";

export default function AdminLogin({ navigate }){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [resetMode, setResetMode] = useState(false);

  async function login(e){
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if(error){ setMsg(error.message); return; }
    navigate("/admin");
  }

  async function sendReset(e){
    e.preventDefault();
    setMsg("");

    const redirectTo = `${window.location.origin}/admin/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if(error){ setMsg(error.message); return; }
    setMsg("Password reset email sent. Please open the latest email from Supabase.");
  }

  return (
    <div className="adminShell">
      <form className="loginCard" onSubmit={resetMode ? sendReset : login}>
        <div className="brandMark">Onlin.in</div>
        <h1>{resetMode ? "Reset Password" : "Admin Login"}</h1>
        <p>{resetMode ? "Enter your admin email and we will send a password reset link." : "Manage forms, submissions, reports and knowledge centre."}</p>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        {!resetMode && (
          <>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </>
        )}
        {msg && <div className="errorText">{msg}</div>}
        <button className="btn primary full">{resetMode ? "Send Reset Link" : "Login"}</button>
        <button
          type="button"
          className="btn secondary full"
          onClick={() => {
            setMsg("");
            setResetMode(!resetMode);
          }}
          style={{ marginTop: 10 }}
        >
          {resetMode ? "Back to Login" : "Forgot Password?"}
        </button>
      </form>
    </div>
  );
}
