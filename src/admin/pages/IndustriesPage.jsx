import React, { useState } from "react";
import { supabase } from "../../services/supabase";

export default function IndustriesPage({ industries, reload }){
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function add(e){
    e.preventDefault();
    const { error } = await supabase.from("industries").insert({
      name,
      slug,
      description: `${name} diagnostic engine`,
      sort_order: industries.length + 1,
      is_active: true
    });
    if(error) return alert(error.message);
    setName("");
    setSlug("");
    reload();
  }

  return (
    <>
      <h1>Industries</h1>
      <div className="adminCard">
        <form className="adminForm" onSubmit={add}>
          <input placeholder="Industry Name" value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replaceAll(" ", "-")); }} />
          <input placeholder="slug" value={slug} onChange={e => setSlug(e.target.value)} />
          <button className="btn primary">Add Industry</button>
        </form>
      </div>
      <div className="tableWrap">
        <table><thead><tr><th>Name</th><th>Slug</th><th>Active</th></tr></thead><tbody>{industries.map(i => <tr key={i.id}><td>{i.name}</td><td>{i.slug}</td><td>{i.is_active ? "Yes" : "No"}</td></tr>)}</tbody></table>
      </div>
    </>
  );
}
