import React, { useEffect, useState } from "react";

export default function SectionEditor({ section, onSave, onDuplicate, onDelete }){
  const [draft, setDraft] = useState(section);

  useEffect(() => {
    setDraft(section);
  }, [section.id]);

  return (
    <div className="sectionEditor">
      <input
        className="sectionTitleInput"
        value={draft.title || ""}
        onChange={e => setDraft({ ...draft, title: e.target.value })}
      />
      <textarea
        className="sectionDescInput"
        value={draft.description || ""}
        onChange={e => setDraft({ ...draft, description: e.target.value })}
      />
      <div className="formActions">
        <button type="button" className="btn primary" onClick={() => onSave(draft)}>
          Save Section
        </button>
        <button type="button" className="btn secondary" onClick={() => onDuplicate(section)}>
          Duplicate Section
        </button>
        <button type="button" className="btn secondary" onClick={() => onDelete(section)}>
          Delete Section
        </button>
      </div>
    </div>
  );
}
