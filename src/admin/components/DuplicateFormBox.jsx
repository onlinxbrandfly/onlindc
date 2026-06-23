import React, { useState } from "react";
import { duplicateIndustryForm } from "../services/formBuilderService";

export default function DuplicateFormBox({ industries, sourceIndustryId, reload }) {
  const [targetIndustryId, setTargetIndustryId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const sourceIndustry = industries.find((i) => i.id === sourceIndustryId);

  async function handleDuplicate() {
    setMessage("");
    setBusy(true);

    try {
      const result = await duplicateIndustryForm({
        sourceIndustryId,
        targetIndustryId
      });

      setMessage(
        `Duplicated successfully: ${result.sections.copied} sections, ${result.questions.copied} questions, ${result.options.copied} options copied. Skipped existing: ${result.sections.skipped} sections, ${result.questions.skipped} questions, ${result.options.skipped} options.`
      );

      setTargetIndustryId("");
      if (reload) await reload();
    } catch (error) {
      alert(error.message || "Could not duplicate form.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="duplicateFormBox">
      <div>
        <label>Duplicate Form</label>
        <p className="muted">
          Copy the complete form from {sourceIndustry?.name || "selected industry"} to another industry.
        </p>
      </div>

      <div className="duplicateFormControls">
        <select value={targetIndustryId} onChange={(e) => setTargetIndustryId(e.target.value)}>
          <option value="">Select target industry</option>
          {industries
            .filter((industry) => industry.id !== sourceIndustryId)
            .map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))}
        </select>

        <button
          type="button"
          className="btn primary"
          disabled={busy || !targetIndustryId}
          onClick={handleDuplicate}
        >
          {busy ? "Duplicating..." : "Duplicate Form"}
        </button>
      </div>

      {message && <div className="successToast">{message}</div>}
    </div>
  );
}
