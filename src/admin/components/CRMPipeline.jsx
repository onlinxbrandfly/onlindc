import React from "react";
import { CRM_STAGES, leadContact } from "../services/crmService";

export default function CRMPipeline({ leads, onOpen, onMove }) {
  return <div className="crmPipeline">
    {CRM_STAGES.map((stage) => {
      const items = leads.filter((lead) => (lead.stage || lead.status || "New") === stage);
      return <section className="pipelineColumn" key={stage}>
        <header><b>{stage}</b><span>{items.length}</span></header>
        <div className="pipelineCards">
          {items.map((lead) => {
            const contact = leadContact(lead);
            return <button type="button" className="pipelineLead" key={lead.id} onClick={() => onOpen(lead)}>
              <b>{contact.businessName}</b><small>{contact.contactName || lead.source}</small><span>{lead.priority_label}</span>
            </button>;
          })}
          {!items.length && <p className="pipelineEmpty">No leads</p>}
        </div>
        {items.length > 0 && <select aria-label={`Move a lead from ${stage}`} defaultValue="" onChange={(e) => { const [leadId, next] = e.target.value.split("|"); if (leadId) onMove(leads.find((lead) => lead.id === leadId), next); e.target.value = ""; }}>
          <option value="">Move lead...</option>
          {items.flatMap((lead) => CRM_STAGES.filter((next) => next !== stage).map((next) => <option key={`${lead.id}-${next}`} value={`${lead.id}|${next}`}>{leadContact(lead).businessName} to {next}</option>))}
        </select>}
      </section>;
    })}
  </div>;
}
