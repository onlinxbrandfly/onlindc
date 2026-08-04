import React from "react";
import { CRM_SOURCES, CRM_STAGES } from "../services/crmService";

export default function CRMFilters({ filters, onChange }) {
  return <div className="crmFilters">
    <input aria-label="Search leads" placeholder="Search business, person, phone..." value={filters.search} onChange={(e) => onChange({ ...filters, search: e.target.value })} />
    <select aria-label="Filter by stage" value={filters.stage} onChange={(e) => onChange({ ...filters, stage: e.target.value })}><option value="">All stages</option>{CRM_STAGES.map((item) => <option key={item}>{item}</option>)}</select>
    <select aria-label="Filter by source" value={filters.source} onChange={(e) => onChange({ ...filters, source: e.target.value })}><option value="">All sources</option>{CRM_SOURCES.map((item) => <option key={item}>{item}</option>)}</select>
    <select aria-label="Filter by priority" value={filters.priority} onChange={(e) => onChange({ ...filters, priority: e.target.value })}><option value="">All priorities</option><option>High Priority</option><option>Good Opportunity</option><option>Nurture</option></select>
  </div>;
}
