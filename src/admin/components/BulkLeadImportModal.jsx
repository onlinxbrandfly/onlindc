import React, { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { downloadLeadTemplate, parseLeadFile } from "../services/leadImportService";

export default function BulkLeadImportModal({ leads, industries, agents, canManage, onClose, onImport }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [duplicateMode, setDuplicateMode] = useState("skip");
  const [assignedAgentId, setAssignedAgentId] = useState("");
  const [createPlans, setCreatePlans] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const summary = useMemo(() => ({ valid: rows.filter((row) => !row.errors.length).length, invalid: rows.filter((row) => row.errors.length).length, duplicates: rows.filter((row) => row.duplicate).length }), [rows]);

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(""); setResult(null);
    try { setRows(await parseLeadFile(file, { industries, agents, existingLeads: leads })); setFileName(file.name); }
    catch (parseError) { setRows([]); setError(parseError.message || "Could not read this file."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function importRows() {
    setBusy(true); setError("");
    try { setResult(await onImport(rows, { duplicateMode, assignedAgentId, createPlans })); }
    catch (importError) { setError(importError.message || "Import could not be completed."); }
    finally { setBusy(false); }
  }

  return <div className="modalBackdrop"><section className="modal bulkLeadModal">
    <button className="modalClose" type="button" onClick={onClose} aria-label="Close"><X size={20}/></button>
    <span className="pageEyebrow">CRM import</span><h2>Bulk add leads</h2><p className="muted">Upload a CSV or Excel file, review it, then import only the valid rows.</p>
    {!rows.length && !result && <div className="bulkUploadZone"><FileSpreadsheet size={38}/><b>{busy ? "Reading file..." : "Choose your lead file"}</b><span>CSV or XLSX</span><label className="btn primary"><Upload size={17}/>Select file<input type="file" accept=".csv,.xlsx" onChange={chooseFile} disabled={busy}/></label><button className="btn" type="button" onClick={downloadLeadTemplate}><Download size={17}/>Download template</button></div>}
    {error && <div className="errorBox">{error}</div>}
    {rows.length > 0 && !result && <>
      <div className="bulkImportSummary"><span><b>{rows.length}</b>Total</span><span><b>{summary.valid}</b>Valid</span><span className={summary.invalid ? "bad" : ""}><b>{summary.invalid}</b>Invalid</span><span><b>{summary.duplicates}</b>Existing</span></div>
      <div className="bulkImportOptions"><label><span>Existing leads</span><select value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value)}><option value="skip">Skip duplicates</option><option value="update">Update existing leads</option></select></label>{canManage && <label><span>Assign all to</span><select value={assignedAgentId} onChange={(event) => setAssignedAgentId(event.target.value)}><option value="">Use spreadsheet/default</option>{agents.filter((agent) => agent.is_active).map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name}</option>)}</select></label>}<label className="checkRow"><input type="checkbox" checked={createPlans} onChange={(event) => setCreatePlans(event.target.checked)}/> Create 30-day follow-up plans</label></div>
      <div className="bulkPreview"><table><thead><tr><th>Row</th><th>Business</th><th>Contact</th><th>Industry</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowNumber} className={row.errors.length ? "invalid" : ""}><td>{row.rowNumber}</td><td>{row.values.business_name || "-"}</td><td>{row.values.phone || row.values.email || "-"}</td><td>{industries.find((item) => item.id === row.values.industry_id)?.name || "-"}</td><td>{row.errors.length ? row.errors.join("; ") : row.duplicate ? "Existing lead" : "Ready"}</td></tr>)}</tbody></table></div>
      <div className="modalActions"><button className="btn" type="button" onClick={() => { setRows([]); setFileName(""); }}>Choose another</button><button className="btn primary" type="button" disabled={busy || !summary.valid} onClick={importRows}><Upload size={17}/>{busy ? "Importing..." : `Import ${summary.valid} leads`}</button></div><small className="muted">{fileName}</small>
    </>}
    {result && <div className="bulkImportResult"><FileSpreadsheet size={42}/><h3>Import complete</h3><div className="bulkImportSummary"><span><b>{result.imported}</b>Added</span><span><b>{result.updated}</b>Updated</span><span><b>{result.skipped}</b>Skipped</span><span className={result.failed ? "bad" : ""}><b>{result.failed}</b>Failed</span></div>{result.errors.length > 0 && <div className="errorBox">{result.errors.slice(0, 8).map((item) => <div key={item}>• {item}</div>)}</div>}<button className="btn primary" type="button" onClick={onClose}>Done</button></div>}
  </section></div>;
}
