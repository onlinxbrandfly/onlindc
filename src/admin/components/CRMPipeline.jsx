import React, { useState } from "react";
import { ArrowRight, IndianRupee } from "lucide-react";
import { CRM_STAGES, leadContact } from "../services/crmService";

export default function CRMPipeline({ leads, onOpen, onMove }) {
  const [mobileStage, setMobileStage] = useState("New");
  return <div className="crmPipeline">
    <div className="pipelineStagePicker"><select aria-label="Pipeline stage" value={mobileStage} onChange={(event) => setMobileStage(event.target.value)}>{CRM_STAGES.map((stage) => <option key={stage}>{stage} ({leads.filter((lead) => (lead.stage || lead.status || "New") === stage).length})</option>)}</select></div>
    {CRM_STAGES.map((stage) => {
      const items = leads.filter((lead) => (lead.stage || lead.status || "New") === stage);
      return <section className={`pipelineColumn ${mobileStage === stage ? "mobileActive" : ""}`} key={stage}>
        <header><b>{stage}</b><span>{items.length}</span></header>
        <div className="pipelineCards">
          {items.map((lead) => {
            const contact = leadContact(lead);
            return <button type="button" className="pipelineLead" key={lead.id} onClick={() => onOpen(lead)}>
              <div><b>{contact.businessName}</b><small>{contact.contactName || lead.source}</small></div><span>{lead.priority_label}</span>{lead.estimated_value ? <small className="pipelineValue"><IndianRupee size={12} />{Number(lead.estimated_value).toLocaleString("en-IN")}</small> : null}<ArrowRight className="pipelineArrow" size={16} />
            </button>;
          })}
          {!items.length && <p className="pipelineEmpty">No leads</p>}
        </div>
      </section>;
    })}
  </div>;
}
