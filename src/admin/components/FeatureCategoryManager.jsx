import React, { useState } from "react";
import { supabase } from "../../services/supabase";

export default function FeatureCategoryManager({ data, reload }){
  const blank = { name:"", description:"", sort_order:0, is_active:true };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const current = editing || form;

  function update(field, value){
    editing ? setEditing({ ...editing, [field]: value }) : setForm({ ...form, [field]: value });
  }

  async function save(e){
    e.preventDefault();
    const payload = {
      name: current.name || "",
      description: current.description || "",
      sort_order: Number(current.sort_order || 0),
      is_active: current.is_active !== false,
      is_star_feature: current.is_star_feature === true,
      star_score: Number(current.star_score || 0),
      updated_at: new Date().toISOString()
    };
    const query = editing?.id
      ? supabase.from("feature_categories").update(payload).eq("id", editing.id)
      : supabase.from("feature_categories").insert(payload);
    const { error } = await query;
    if(error) return alert(error.message);
    setEditing(null);
    setForm(blank);
    reload();
  }

  return (
    <>
      <div className="adminCard">
        <h3>{editing ? "Edit Category" : "Add Feature Category"}</h3>
        <form className="adminForm" onSubmit={save}>
          <input placeholder="Category Name" value={current.name || ""} onChange={e => update("name", e.target.value)} required />
          <input placeholder="Description" value={current.description || ""} onChange={e => update("description", e.target.value)} />
          <input type="number" placeholder="Sort Order" value={current.sort_order || 0} onChange={e => update("sort_order", e.target.value)} />
          <label className="checkRow"><input type="checkbox" checked={current.is_active !== false} onChange={e => update("is_active", e.target.checked)} /> Active</label>
          <div className="formActions">
            {editing && <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>}
            <button className="btn primary">{editing ? "Update" : "Save"}</button>
          </div>
        </form>
      </div>

      <div className="tableWrap">
        <table><thead><tr><th>Industry/Group</th><th>Description</th><th>Sort</th><th>Active</th><th>Action</th></tr></thead>
          <tbody>{(data.featureCategories || []).map(c => (
            <tr key={c.id}><td><b>{c.name}</b></td><td>{c.description}</td><td>{c.sort_order}</td><td>{c.is_active ? "Yes" : "No"}</td><td><button type="button" onClick={() => setEditing(c)}>Edit</button></td></tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
