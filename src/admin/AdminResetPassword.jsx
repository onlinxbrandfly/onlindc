import React, { useState } from "react";
import { supabase } from "../services/supabase";

export default function AdminResetPassword({ navigate }){
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function updatePassword(e){
    e.preventDefault();
    setMsg("");

    if(password.length < 6){
      setMsg("Password must be at least 6 characters.");
      return;
    }

    if(password !== confirmPassword){
      setMsg("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if(error){
      setMsg(error.message);
      return;
    }

    setDone(true);
    setMsg("Password updated successfully. You can now log in.");
  }

  return (
    <div className="adminShell">
      <form className="loginCard" onSubmit={updatePassword}>
        <div className="brandMark">Onlin.in</div>
        <h1>Set New Password</h1>
        <p>Enter a new password for your admin account.</p>

        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={done}
        />

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          disabled={done}
        />

        {msg && <div className={done ? "successToast" : "errorText"}>{msg}</div>}

        {!done && (
          <button className="btn primary full" disabled={busy}>
            {busy ? "Updating..." : "Update Password"}
          </button>
        )}

        <button
          type="button"
          className="btn secondary full"
          onClick={() => navigate("/admin/login")}
          style={{ marginTop: 10 }}
        >
          Back to Login
        </button>
      </form>
    </div>
  );
}
