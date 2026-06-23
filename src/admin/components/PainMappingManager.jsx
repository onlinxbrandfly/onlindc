import React, { useState } from "react";
import { supabase } from "../../services/supabase";

export default function PainMappingManager({ data, reload }){
  const blank = { industry_id:data.industries[0]?.id || "", pain_code:"", feature_id:data.features[0]?.id || "", priority:80, relevance_score:80, recommendation_text:"", use_case_text:"", stage_slug:"manual", is_active:true };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const current = editing || form;

  function update(field, value){
    editing ? setEditing({ ...editing, [field]: value }) : setForm({ ...form, [field]: value });
  }

  async function save(e){
    e.preventDefault();
    const pain = data.painMaster.find(p => p.code === current.pain_code);
    const payload = {
      industry_id: current.industry_id || null,
      pain_code: current.pain_code,
      pain_point: pain?.title || current.pain_code,
      feature_id: current.feature_id || null,
      priority: Number(current.priority || 0),
      relevance_score: Number(current.relevance_score || 0),
      recommendation_text: current.recommendation_text || "",
      use_case_text: current.use_case_text || "",
      stage_slug: current.stage_slug || "",
      is_active: current.is_active !== false,
      is_star_feature: current.is_star_feature === true,
      star_score: Number(current.star_score || 0),
      updated_at: new Date().toISOString()
    };
    const query = editing?.id
      ? supabase.from("pain_point_feature_mapping").update(payload).eq("id", editing.id)
      : supabase.from("pain_point_feature_mapping").insert(payload);
    const { error } = await query;
    if(error) return alert(error.message);
    setEditing(null);
    setForm(blank);
    reload();
  }

  return (
    <>
      <div className="adminCard">
        <h3>{editing ? "Edit Pain Mapping" : "Add Pain Mapping"}</h3>
        <form className="knowledgeForm" onSubmit={save}>
          <select value={current.industry_id || ""} onChange={e => update("industry_id", e.target.value)}>{data.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
          <select value={current.pain_code || ""} onChange={e => update("pain_code", e.target.value)}><option value="">Select Pain</option>{(data.painMaster || []).map(p => <option key={p.code} value={p.code}>{p.title}</option>)}</select>
          <select value={current.feature_id || ""} onChange={e => update("feature_id", e.target.value)}>{data.features.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select value={current.stage_slug || ""} onChange={e => update("stage_slug", e.target.value)}><option value="">All Stages</option><option value="manual">Manual</option><option value="under_structured">Under Structured</option><option value="growth_ready">Growth Ready</option><option value="future_ready">Future Ready</option></select>
          <input type="number" placeholder="Priority" value={current.priority || 0} onChange={e => update("priority", e.target.value)} />
          <input type="number" placeholder="Relevance Score" value={current.relevance_score || 0} onChange={e => update("relevance_score", e.target.value)} />
          <textarea placeholder="Recommendation text shown in report" value={current.recommendation_text || ""} onChange={e => update("recommendation_text", e.target.value)} />
          <textarea placeholder="Use case text" value={current.use_case_text || ""} onChange={e => update("use_case_text", e.target.value)} />
          <label className="checkRow"><input type="checkbox" checked={current.is_active !== false} onChange={e => update("is_active", e.target.checked)} /> Active</label>
          <div className="formActions">{editing && <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>}<button className="btn primary">{editing ? "Update" : "Save"}</button></div>
        </form>
      </div>

      <div className="tableWrap">
        <table><thead><tr><th>Pain</th><th>Feature</th><th>Industry</th><th>Score</th><th>Action</th></tr></thead>
        <tbody>{(data.painMappings || []).map(m => <tr key={m.id}><td><b>{m.pain_point || m.pain_code}</b><br/><small>{m.stage_slug}</small></td><td>{m.features_library?.name}</td><td>{m.industries?.name}</td><td>{m.priority}/{m.relevance_score}</td><td><button type="button" onClick={() => setEditing({...m, industry_id:m.industry_id || "", feature_id:m.feature_id || ""})}>Edit</button></td></tr>)}</tbody></table>
      </div>
    </>
  );
}
