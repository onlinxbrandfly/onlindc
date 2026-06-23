import React, { useState } from "react";
import { supabase } from "../../services/supabase";

export default function HeroFeatureManager({ data, reload }){
  const blank = { industry_id:data.industries[0]?.id || "", feature_id:data.features[0]?.id || "", stage_slug:"manual", hero_score:80, hero_reason:"", use_case_text:"", is_active:true };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const current = editing || form;

  function update(field, value){
    editing ? setEditing({ ...editing, [field]: value }) : setForm({ ...form, [field]: value });
  }

  async function save(e){
    e.preventDefault();
    const payload = {
      industry_id: current.industry_id || null,
      feature_id: current.feature_id || null,
      stage_slug: current.stage_slug || "",
      hero_score: Number(current.hero_score || 0),
      hero_reason: current.hero_reason || "",
      use_case_text: current.use_case_text || "",
      is_active: current.is_active !== false,
      is_star_feature: current.is_star_feature === true,
      star_score: Number(current.star_score || 0),
      updated_at: new Date().toISOString()
    };
    const query = editing?.id
      ? supabase.from("industry_hero_features").update(payload).eq("id", editing.id)
      : supabase.from("industry_hero_features").insert(payload);
    const { error } = await query;
    if(error) return alert(error.message);
    setEditing(null);
    setForm(blank);
    reload();
  }

  async function toggleStar(feature){
    const { error } = await supabase.from("features_library").update({
      is_star_feature: !feature.is_star_feature,
      star_score: feature.is_star_feature ? 0 : 90,
      updated_at: new Date().toISOString()
    }).eq("id", feature.id);
    if(error) return alert(error.message);
    reload();
  }

  return (
    <>
      <div className="adminCard">
        <h3>{editing ? "Edit Industry Hero Feature" : "Add Industry Hero Feature"}</h3>
        <form className="knowledgeForm" onSubmit={save}>
          <select value={current.industry_id || ""} onChange={e => update("industry_id", e.target.value)}>{data.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
          <select value={current.feature_id || ""} onChange={e => update("feature_id", e.target.value)}>{data.features.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select value={current.stage_slug || ""} onChange={e => update("stage_slug", e.target.value)}><option value="">All Stages</option><option value="manual">Manual</option><option value="under_structured">Under Structured</option><option value="growth_ready">Growth Ready</option><option value="future_ready">Future Ready</option></select>
          <input type="number" placeholder="Hero Score" value={current.hero_score || 0} onChange={e => update("hero_score", e.target.value)} />
          <textarea placeholder="Hero reason" value={current.hero_reason || ""} onChange={e => update("hero_reason", e.target.value)} />
          <textarea placeholder="Use case shown in report" value={current.use_case_text || ""} onChange={e => update("use_case_text", e.target.value)} />
          <label className="checkRow"><input type="checkbox" checked={current.is_active !== false} onChange={e => update("is_active", e.target.checked)} /> Active</label>
          <div className="formActions">{editing && <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>}<button className="btn primary">{editing ? "Update" : "Save"}</button></div>
        </form>
      </div>

      <div className="tableWrap">
        <h3>Industry Hero Features</h3>
        <table><thead><tr><th>Feature</th><th>Industry</th><th>Stage</th><th>Score</th><th>Action</th></tr></thead>
        <tbody>{(data.heroFeatures || []).map(h => <tr key={h.id}><td>{h.features_library?.name}</td><td>{h.industries?.name}</td><td>{h.stage_slug}</td><td>{h.hero_score}</td><td><button type="button" onClick={() => setEditing({...h, industry_id:h.industry_id || "", feature_id:h.feature_id || ""})}>Edit</button></td></tr>)}</tbody></table>
      </div>

      <div className="tableWrap">
        <h3>Global Star Feature Toggle</h3>
        <table><thead><tr><th>Feature</th><th>Industry/Group</th><th>Star</th><th>Action</th></tr></thead>
        <tbody>{data.features.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.feature_category}</td><td>{f.is_star_feature ? "★ Star" : "-"}</td><td><button type="button" onClick={() => toggleStar(f)}>{f.is_star_feature ? "Unstar" : "Mark Star"}</button></td></tr>)}</tbody></table>
      </div>
    </>
  );
}
