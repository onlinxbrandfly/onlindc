import React, { useState } from "react";
import { supabase } from "../../services/supabase";

const QUESTION_TYPES = ["text","email","phone","number","textarea","single","multiple","select"];
const TYPE_LABELS = { text:"Short Answer", email:"Email", phone:"Phone", number:"Number", textarea:"Paragraph", single:"Single Choice", multiple:"Checkboxes", select:"Dropdown" };

export default function QuestionEditor({ data, sections, allQuestions, reload, close }){
  const isEdit = data.mode === "edit";
  const base = isEdit ? data.question : {
    industry_id: data.industry_id,
    section_id: data.section_id,
    question_text: "",
    question_key: "",
    question_type: "single",
    placeholder: "",
    help_text: "",
    weight: 1,
    is_required: true,
    is_active: true
  };

  const [form, setForm] = useState(base);
  const [opts, setOpts] = useState(isEdit ? (data.options.length ? data.options : [{ option_text: "", score: 0 }]) : [{ option_text: "", score: 0 }, { option_text: "", score: 0 }]);
  const needsOptions = ["single","multiple","select"].includes(form.question_type);

  async function save(){
    if(!form.question_text.trim()) return alert("Question text is required.");
    if(needsOptions && !opts.some(o => o.option_text.trim())) return alert("Add at least one option.");

    const payload = {
      industry_id: form.industry_id,
      section_id: form.section_id,
      question_text: form.question_text,
      question_key: form.question_key,
      question_type: form.question_type,
      placeholder: form.placeholder,
      is_required: !!form.is_required,
      is_active: form.is_active !== false,
      sort_order: form.sort_order || (allQuestions.filter(q => q.section_id === form.section_id).length + 1)
    };

    let questionId = form.id;

    if(isEdit){
      const { error } = await supabase.from("questions").update(payload).eq("id", form.id);
      if(error) return alert(error.message);
    } else {
      const { data: newQ, error } = await supabase.from("questions").insert(payload).select().single();
      if(error) return alert(error.message);
      questionId = newQ.id;
    }

    if(needsOptions){
      for(let i = 0; i < opts.length; i++){
        const o = opts[i];
        if(!o.option_text.trim()) continue;

        const payload = {
          option_text: o.option_text,
          option_value: o.option_value || o.option_text.toLowerCase().replaceAll(" ", "_"),
          score: Number(o.score || 0),
          is_active: o.is_active !== false,
          sort_order: i + 1
        };

        if(o.id){
          await supabase.from("question_options").update(payload).eq("id", o.id);
        } else {
          await supabase.from("question_options").insert({ ...payload, question_id: questionId });
        }
      }
    }

    reload();
    close();
  }

  async function deleteOption(o, index){
    if(o.id){
      if(!confirm("Delete this option?")) return;
      await supabase.from("question_options").delete().eq("id", o.id);
    }
    setOpts(opts.filter((_, i) => i !== index));
  }

  return (
    <div className="modalBackdrop">
      <div className="modal builderModal">
        <button className="modalClose" onClick={close}>×</button>
        <h2>{isEdit ? "Edit Question" : "Add Question"}</h2>

        <div className="editorGrid">
          <div className="stack">
            <label>Section</label>
            <select value={form.section_id || ""} onChange={e => setForm({ ...form, section_id: e.target.value })}>
              {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>

            <label>Question</label>
            <input value={form.question_text || ""} onChange={e => setForm({ ...form, question_text: e.target.value })} />

            <label>Help Text</label>
            <textarea value={form.help_text || ""} onChange={e => setForm({ ...form, help_text: e.target.value })} />

            <div className="twoCol">
              <div>
                <label>Type</label>
                <select value={form.question_type} onChange={e => setForm({ ...form, question_type: e.target.value })}>
                  {QUESTION_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label>Weight</label>
                <input type="number" value={form.weight || 1} onChange={e => setForm({ ...form, weight: e.target.value })} />
              </div>
            </div>

            <label>Question Key</label>
            <input value={form.question_key || ""} onChange={e => setForm({ ...form, question_key: e.target.value })} placeholder="e.g. business_name" />

            <label>Placeholder</label>
            <input value={form.placeholder || ""} onChange={e => setForm({ ...form, placeholder: e.target.value })} />

            <label className="checkRow"><input type="checkbox" checked={!!form.is_required} onChange={e => setForm({ ...form, is_required: e.target.checked })} /> Required</label>
          </div>

          <div className="stack">
            <h3>Options & Scores</h3>
            {!needsOptions && <div className="emptyState">This question type does not need options.</div>}

            {needsOptions && (
              <>
                <p className="muted small">Scores are used for readiness calculation. Higher score = stronger digital maturity.</p>
                {opts.map((o, i) => (
                  <div className="optionEditCard" key={o.id || i}>
                    <input placeholder={`Option ${i+1}`} value={o.option_text || ""} onChange={e => setOpts(opts.map((x, idx) => idx === i ? { ...x, option_text: e.target.value } : x))} />
                    <div className="twoCol">
                      <input type="number" placeholder="Score" value={o.score || 0} onChange={e => setOpts(opts.map((x, idx) => idx === i ? { ...x, score: e.target.value } : x))} />
                      <input placeholder="Score Label" value={o.score_label || ""} onChange={e => setOpts(opts.map((x, idx) => idx === i ? { ...x, score_label: e.target.value } : x))} />
                    </div>
                    <textarea placeholder="Option help text" value={o.help_text || ""} onChange={e => setOpts(opts.map((x, idx) => idx === i ? { ...x, help_text: e.target.value } : x))} />
                    <button className="btn secondary" onClick={() => deleteOption(o, i)}>Delete Option</button>
                  </div>
                ))}
                <button className="btn secondary" onClick={() => setOpts([...opts, { option_text: "", score: 0 }])}>+ Add Option</button>
              </>
            )}
          </div>
        </div>

        <div className="modalActions">
          <button className="btn secondary" onClick={close}>Cancel</button>
          <button className="btn primary" onClick={save}>Save Question</button>
        </div>
      </div>
    </div>
  );
}
