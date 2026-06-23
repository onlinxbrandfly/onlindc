import React, { useState } from "react";
import { supabase } from "../../services/supabase";
import { normalizeId } from "../services/normalizeId";

export default function UseCaseList({ data, reload, editing, setEditing }){
  const blank = { feature_id:data.features[0]?.id || "", industry_id:data.industries[0]?.id || "", title:"", pain_point:"", business_type:"", use_case:"", report_text:"", video_url:"", external_url:"", priority:50, is_active:true };
  const [form, setForm] = useState(blank);
  const current = editing || form;

  function update(field, value){
    editing ? setEditing({ ...editing, [field]: value }) : setForm({ ...form, [field]: value });
  }

  async function save(e){
    e.preventDefault();
    const payload = {
      feature_id: normalizeId(current.feature_id),
      industry_id: normalizeId(current.industry_id),
      title: current.title || "",
      pain_point: current.pain_point || "",
      business_type: current.business_type || "",
      use_case: current.use_case || "",
      report_text: current.report_text || "",
      video_url: current.video_url || "",
      external_url: current.external_url || "",
      priority: Number(current.priority || 0),
      is_active: current.is_active !== false,
      is_star_feature: current.is_star_feature === true,
      star_score: Number(current.star_score || 0),
      updated_at: new Date().toISOString()
    };

    if(editing?.id){
      const { error } = await supabase.from("feature_use_cases").update(payload).eq("id", editing.id);
      if(error) return alert(error.message);
      setEditing(null);
    } else {
      const { error } = await supabase.from("feature_use_cases").insert(payload);
      if(error) return alert(error.message);
      setForm(blank);
    }
    reload();
  }

  return (
    <>
      <div className="adminCard">
        <h3>{editing ? "Edit Use Case" : "Add Use Case"}</h3>
        <form className="knowledgeForm" onSubmit={save}>
          <select value={current.feature_id || ""} onChange={e => update("feature_id", e.target.value)}>
            <option value="">Select Feature</option>
            {data.features.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={current.industry_id || ""} onChange={e => update("industry_id", e.target.value)}>
            <option value="">Select Industry</option>
            {data.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <input placeholder="Use Case Title" value={current.title || ""} onChange={e => update("title", e.target.value)} required />
          <input placeholder="Pain Point" value={current.pain_point || ""} onChange={e => update("pain_point", e.target.value)} />
          <input placeholder="Business Type" value={current.business_type || ""} onChange={e => update("business_type", e.target.value)} />
          <textarea placeholder="Use Case" value={current.use_case || ""} onChange={e => update("use_case", e.target.value)} />
          <textarea placeholder="Report Text" value={current.report_text || ""} onChange={e => update("report_text", e.target.value)} />
          <input placeholder="External URL" value={current.external_url || ""} onChange={e => update("external_url", e.target.value)} />
          <input placeholder="Video URL" value={current.video_url || ""} onChange={e => update("video_url", e.target.value)} />
          <input type="number" placeholder="Priority" value={current.priority || 0} onChange={e => update("priority", e.target.value)} />
          <input type="number" placeholder="Star Score" value={current.star_score || 0} onChange={e => update("star_score", e.target.value)} />
          <label className="checkRow"><input type="checkbox" checked={current.is_star_feature === true} onChange={e => update("is_star_feature", e.target.checked)} /> Star Feature</label>
          <label className="checkRow"><input type="checkbox" checked={current.is_active !== false} onChange={e => update("is_active", e.target.checked)} /> Active</label>
          <div className="formActions">
            {editing && <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>}
            <button className="btn primary">{editing ? "Update Use Case" : "Save Use Case"}</button>
          </div>
        </form>
      </div>

      <div className="knowledgeGrid">
        {data.useCases.map(u => (
          <div className={u.is_active ? "knowledgeCard" : "knowledgeCard faded"} key={u.id}>
            <span>{u.features_library?.name}</span>
            <h3>{u.title}</h3>
            <p>{u.report_text || u.use_case}</p>
            <small>{u.industries?.name} • {u.pain_point} • {u.business_type}</small>
            <div className="cardMiniActions">
              <button type="button" onClick={() => setEditing({ ...u, feature_id: u.feature_id || "", industry_id: u.industry_id || "" })}>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
