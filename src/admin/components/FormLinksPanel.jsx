import React from "react";
import { Copy, ExternalLink, Gem, Link2, Shirt } from "lucide-react";

function buildLink(origin, industry, agentCode) {
  const params = new URLSearchParams();
  if (industry) params.set("industry", industry);
  if (agentCode) params.set("agent", agentCode);
  return `${origin}/${params.size ? `?${params}` : ""}`;
}

export default function FormLinksPanel({ agent, notify }) {
  const origin = window.location.origin;
  const links = [
    { label: "General diagnostic", description: "Lets the business choose its category", industry: "", icon: Link2 },
    { label: "Jewellery diagnostic", description: "Opens with Jewellery selected", industry: "jewellery", icon: Gem },
    { label: "Fashion / Clothing", description: "Opens with Fashion selected", industry: "fashion", icon: Shirt }
  ];

  async function copy(url) {
    await navigator.clipboard.writeText(url);
    notify(agent ? `${agent.full_name}'s form link copied.` : "Form link copied.");
  }

  return <section className="adminCard formLinksPanel">
    <div className="crmSectionHead"><div><h2>{agent ? `${agent.full_name}'s form links` : "Form links"}</h2><p className="muted">{agent ? "Leads submitted through these links are attributed to this user." : "Share the right diagnostic link from one place."}</p></div></div>
    <div className="formLinkGrid">{links.map(({ label, description, industry, icon: Icon }) => {
      const url = buildLink(origin, industry, agent?.agent_code);
      return <article className="formLinkCard" key={label}><span><Icon size={20} /></span><div><b>{label}</b><small>{description}</small><code>{url}</code></div><div><button type="button" onClick={() => copy(url)} aria-label={`Copy ${label}`}><Copy size={17} /></button><a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${label}`}><ExternalLink size={17} /></a></div></article>;
    })}</div>
  </section>;
}
