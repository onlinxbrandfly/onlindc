import React, { useState } from "react";
import { supabase } from "../../services/supabase";

export default function FeatureList({ data, reload, editing, setEditing, openMedia }){
  const blank = { name:"", slug:"", global_feature:true, feature_category:"", short_description:"", feature_link:"", video_url:"", icon_url:"", priority:50, is_active:true, is_star_feature:false, star_score:0 };
  const [form, setForm] = useState(blank);
  const current = editing || form;

  function update(field, value){
    editing ? setEditing({ ...editing, [field]: value }) : setForm({ ...form, [field]: value });
  }

  async function save(e){
    e.preventDefault();
    const slug = current.slug || String(current.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = {
      name: current.name || "",
      slug,
      global_feature: current.global_feature !== false,
      feature_category: current.feature_category || "",
      short_description: current.short_description || "",
      feature_link: current.feature_link || "",
      video_url: current.video_url || "",
      icon_url: current.icon_url || "",
      priority: Number(current.priority || 0),
      is_active: current.is_active !== false,
      is_star_feature: current.is_star_feature === true,
      star_score: Number(current.star_score || 0),
      updated_at: new Date().toISOString()
    };

    if(editing?.id){
      const { error } = await supabase.from("features_library").update(payload).eq("id", editing.id);
      if(error) return alert(error.message);
      setEditing(null);
    } else {
      const { error } = await supabase.from("features_library").insert(payload);
      if(error) return alert(error.message);
      setForm(blank);
    }

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
        <h3>{editing ? "Edit Feature" : "Add Feature"}</h3>
        <form className="adminForm" onSubmit={save}>
          <input placeholder="Feature Name" value={current.name || ""} onChange={e => update("name", e.target.value)} required />
          <input placeholder="Slug" value={current.slug || ""} onChange={e => update("slug", e.target.value)} />
          <input placeholder="Industry / Feature Group" value={current.feature_category || ""} onChange={e => update("feature_category", e.target.value)} />
          <input placeholder="Feature Link" value={current.feature_link || ""} onChange={e => update("feature_link", e.target.value)} />
          <input placeholder="Video URL" value={current.video_url || ""} onChange={e => update("video_url", e.target.value)} />
          <input placeholder="Icon URL" value={current.icon_url || ""} onChange={e => update("icon_url", e.target.value)} />
          <textarea placeholder="Short Description" value={current.short_description || ""} onChange={e => update("short_description", e.target.value)} />
          <input type="number" placeholder="Priority" value={current.priority || 0} onChange={e => update("priority", e.target.value)} />
          <input type="number" placeholder="Star Score" value={current.star_score || 0} onChange={e => update("star_score", e.target.value)} />
          <label className="checkRow"><input type="checkbox" checked={current.is_star_feature === true} onChange={e => update("is_star_feature", e.target.checked)} /> Star Feature</label>
          <label className="checkRow"><input type="checkbox" checked={current.is_active !== false} onChange={e => update("is_active", e.target.checked)} /> Active</label>
          <div className="formActions">
            {editing && <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>}
            <button className="btn primary">{editing ? "Update Feature" : "Save Feature"}</button>
          </div>
        </form>
      </div>

      <div className="tableWrap">
        <table>
          <thead><tr><th>Feature</th><th>Media</th><th>Links</th><th>Priority</th><th>Star</th><th>Actions</th></tr></thead>
          <tbody>
            {data.features.map(f => {
              const count = (data.media || []).filter(m => m.feature_id === f.id).length;
              return (
                <tr key={f.id}>
                  <td><b>{f.name}</b><br/><small>{f.short_description}</small></td>
                  <td>{count} media</td>
                  <td><small>{f.feature_link || "No link"}<br/>{f.video_url || "No video"}</small></td>
                  <td>{f.priority}</td>
                  <td>{f.is_star_feature ? "★" : "-"}</td>
                  <td><div className="rowActions">
                    <button type="button" onClick={() => setEditing(f)}>Edit</button>
                    <button type="button" onClick={() => openMedia(f)}>Manage Media</button>
                    <button type="button" onClick={() => toggleStar(f)}>{f.is_star_feature ? "Unstar" : "Star"}</button>
                    {f.feature_link && <a href={f.feature_link} target="_blank">Open</a>}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
