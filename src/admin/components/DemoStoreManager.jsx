import React, { useState } from "react";
import { supabase } from "../../services/supabase";

export default function DemoStoreManager({ data, reload }){
  const blank = {
    industry_id: data.industries[0]?.id || "",
    title: "",
    subtitle: "",
    description: "",
    logo_url: "",
    external_url: "",
    related_business_type: "",
    related_pain_point: "",
    priority: 50,
    is_active: true
  };

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const current = editing || form;
  const demoStores = (data.assets || []).filter(a => a.asset_type === "demo_store");

  function update(field, value){
    editing ? setEditing({ ...editing, [field]: value }) : setForm({ ...form, [field]: value });
  }

  async function save(e){
    e.preventDefault();
    const payload = {
      industry_id: current.industry_id || null,
      asset_type: "demo_store",
      title: current.title || "",
      subtitle: current.subtitle || "",
      description: current.description || "",
      logo_url: current.logo_url || "",
      image_url: current.logo_url || "",
      external_url: current.external_url || "",
      related_business_type: current.related_business_type || "",
      related_pain_point: current.related_pain_point || "",
      priority: Number(current.priority || 0),
      sort_order: Number(current.priority || 0),
      is_active: current.is_active !== false,
      is_star_feature: current.is_star_feature === true,
      star_score: Number(current.star_score || 0),
      updated_at: new Date().toISOString()
    };

    if(editing?.id){
      const { error } = await supabase.from("report_assets").update(payload).eq("id", editing.id);
      if(error) return alert("Demo store update failed: " + error.message);
      setEditing(null);
    } else {
      const { error } = await supabase.from("report_assets").insert(payload);
      if(error) return alert("Demo store save failed: " + error.message);
      setForm(blank);
    }
    reload();
  }

  async function remove(item){
    if(!confirm("Delete this demo store?")) return;
    const { error } = await supabase.from("report_assets").delete().eq("id", item.id);
    if(error) return alert(error.message);
    reload();
  }

  return (
    <>
      <div className="adminCard">
        <h3>{editing ? "Edit Demo Store" : "Add Demo Store"}</h3>
        <p className="muted">Manage demo store links and map them to industries, business types or pain areas.</p>

        <form className="knowledgeForm" onSubmit={save}>
          <select value={current.industry_id || ""} onChange={e => update("industry_id", e.target.value)}>
            <option value="">All Industries</option>
            {data.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <input placeholder="Demo Store Title" value={current.title || ""} onChange={e => update("title", e.target.value)} required />
          <input placeholder="Subtitle / Industry" value={current.subtitle || ""} onChange={e => update("subtitle", e.target.value)} />
          <input placeholder="Demo Store URL" value={current.external_url || ""} onChange={e => update("external_url", e.target.value)} />
          <input placeholder="Logo/Image URL" value={current.logo_url || ""} onChange={e => update("logo_url", e.target.value)} />
          <input placeholder="Related business type e.g. Boutique" value={current.related_business_type || ""} onChange={e => update("related_business_type", e.target.value)} />
          <input placeholder="Related pain point" value={current.related_pain_point || ""} onChange={e => update("related_pain_point", e.target.value)} />
          <textarea placeholder="Description" value={current.description || ""} onChange={e => update("description", e.target.value)} />
          <input type="number" placeholder="Priority" value={current.priority || 0} onChange={e => update("priority", e.target.value)} />
          <input type="number" placeholder="Star Score" value={current.star_score || 0} onChange={e => update("star_score", e.target.value)} />
          <label className="checkRow"><input type="checkbox" checked={current.is_star_feature === true} onChange={e => update("is_star_feature", e.target.checked)} /> Star Feature</label>
          <label className="checkRow"><input type="checkbox" checked={current.is_active !== false} onChange={e => update("is_active", e.target.checked)} /> Active</label>

          <div className="formActions">
            {editing && <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>}
            <button className="btn primary">{editing ? "Update Demo Store" : "Save Demo Store"}</button>
          </div>
        </form>
      </div>

      <div className="knowledgeGrid">
        {demoStores.map(d => (
          <div className={d.is_active ? "knowledgeCard" : "knowledgeCard faded"} key={d.id}>
            <span>{d.industries?.name || "All Industries"}</span>
            <h3>{d.title}</h3>
            <p>{d.description}</p>
            <small>{d.subtitle} • {d.related_business_type} • {d.related_pain_point}</small>
            <div className="cardMiniActions">
              <button type="button" onClick={() => setEditing(d)}>Edit</button>
              <button type="button" onClick={() => remove(d)}>Delete</button>
              {d.external_url && <a href={d.external_url} target="_blank">Open</a>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
