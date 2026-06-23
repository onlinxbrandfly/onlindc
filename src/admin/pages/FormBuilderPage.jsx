import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import DuplicateFormBox from "../components/DuplicateFormBox";
import SectionEditor from "../components/SectionEditor";
import QuestionEditor from "../components/QuestionEditor";
import FormHealthCheck from "../components/FormHealthCheck";
import {
  deleteEmptySection,
  deleteSectionWithChildren,
  duplicateSection,
  clearIndustryForm,
  moveQuestionToSection,
  moveQuestionsAndDeleteSection
} from "../services/formBuilderService";

const TYPE_LABELS = { text:"Short Answer", email:"Email", phone:"Phone", number:"Number", textarea:"Paragraph", single:"Single Choice", multiple:"Checkboxes", select:"Dropdown" };

export default function FormBuilderPage({ data, reload }){
  const [industryId, setIndustryId] = useState(data.industries[0]?.id || "");
  const [activeSection, setActiveSection] = useState("");
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newSection, setNewSection] = useState({ title: "", description: "" });
  const [deleteSectionDraft, setDeleteSectionDraft] = useState(null);
  const [moveTargetSectionId, setMoveTargetSectionId] = useState("");
  const [questionMoveTargets, setQuestionMoveTargets] = useState({});

  const sections = data.sections.filter(s => s.industry_id === industryId);
  const questions = data.questions.filter(q => q.industry_id === industryId);
  const activeSectionId = activeSection || sections[0]?.id || "";
  const sectionObj = sections.find(s => s.id === activeSectionId);

  useEffect(() => {
    if(!activeSection && sections[0]) setActiveSection(sections[0].id);
  }, [industryId, data.sections.length]);

  async function addSection(e){
    e.preventDefault();
    if(!newSection.title.trim()) return alert("Enter section title.");
    const sort_order = sections.reduce((max, s) => Math.max(max, s.sort_order || 0), 0) + 1;
    const { data: section, error } = await supabase.from("question_sections").insert({
      industry_id: industryId,
      title: newSection.title,
      description: newSection.description,
      sort_order,
      is_active: true
    }).select().single();

    if(error) return alert(error.message);
    setNewSection({ title: "", description: "" });
    setActiveSection(section.id);
    reload();
  }

  async function saveSection(sectionDraft){
    if(!sectionDraft?.id) return;
    const { error } = await supabase
      .from("question_sections")
      .update({
        title: sectionDraft.title || "",
        description: sectionDraft.description || "",
        updated_at: new Date().toISOString()
      })
      .eq("id", sectionDraft.id);

    if(error) return alert(error.message);
    await reload();
  }

  async function duplicateQuestion(q){
    const qOptions = data.options.filter(o => o.question_id === q.id);
    const sort_order = questions.filter(x => x.section_id === q.section_id).reduce((max, x) => Math.max(max, x.sort_order || 0), 0) + 1;
    const payload = {
      industry_id: q.industry_id,
      section_id: q.section_id,
      question_text: q.question_text + " (Copy)",
      question_key: q.question_key ? q.question_key + "_copy" : "",
      question_type: q.question_type,
      placeholder: q.placeholder,
      is_required: q.is_required,
      is_active: q.is_active,
      sort_order
    };

    const { data: newQ, error } = await supabase.from("questions").insert(payload).select().single();
    if(error) return alert(error.message);

    if(qOptions.length){
      await supabase.from("question_options").insert(qOptions.map((o, i) => ({
        question_id: newQ.id,
        option_text: o.option_text,
        option_value: o.option_value,
        score: o.score,
        is_active: o.is_active,
        sort_order: i + 1
      })));
    }

    reload();
  }

  async function deleteQuestion(id){
    if(!confirm("Delete this question?")) return;
    await supabase.from("questions").delete().eq("id", id);
    reload();
  }

  async function toggleQuestion(q){
    await supabase.from("questions").update({ is_active: !q.is_active }).eq("id", q.id);
    reload();
  }

  async function handleDuplicateSection(section){
    try {
      const result = await duplicateSection({
        section,
        questions,
        options: data.options
      });

      setActiveSection(result.section.id);
      alert(`Section duplicated: ${result.questions} questions and ${result.options} options copied.`);
      await reload();
    } catch (error) {
      alert(error.message || "Could not duplicate section.");
    }
  }

  function startDeleteSection(section){
    if(sections.length <= 1){
      alert("Cannot delete the last section. Create another section first.");
      return;
    }

    const sectionQuestions = questions.filter(q => q.section_id === section.id);
    const sectionQuestionIds = sectionQuestions.map(q => q.id);
    const sectionOptions = data.options.filter(o => sectionQuestionIds.includes(o.question_id));

    if(!sectionQuestions.length){
      if(!confirm(`Delete empty section "${section.title}"?`)) return;
      deleteEmptySection(section.id)
        .then(async () => {
          setActiveSection("");
          await reload();
        })
        .catch(error => alert(error.message || "Could not delete section."));
      return;
    }

    const fallbackTarget = sections.find(s => s.id !== section.id)?.id || "";
    setMoveTargetSectionId(fallbackTarget);
    setDeleteSectionDraft({
      section,
      questions: sectionQuestions.length,
      options: sectionOptions.length
    });
  }

  async function confirmMoveAndDeleteSection(){
    if(!deleteSectionDraft) return;

    try {
      const result = await moveQuestionsAndDeleteSection({
        sectionId: deleteSectionDraft.section.id,
        targetSectionId: moveTargetSectionId
      });

      alert(`Section deleted. ${result.questions} questions moved.`);
      setDeleteSectionDraft(null);
      setActiveSection(moveTargetSectionId);
      await reload();
    } catch (error) {
      alert(error.message || "Could not move questions and delete section.");
    }
  }

  async function confirmDeleteSectionWithChildren(){
    if(!deleteSectionDraft) return;
    const ok = confirm(`Delete "${deleteSectionDraft.section.title}" with ${deleteSectionDraft.questions} questions and ${deleteSectionDraft.options} options? This cannot be undone.`);
    if(!ok) return;

    try {
      await deleteSectionWithChildren(deleteSectionDraft.section.id);
      alert("Section and its questions/options were deleted.");
      setDeleteSectionDraft(null);
      setActiveSection("");
      await reload();
    } catch (error) {
      alert(error.message || "Could not delete section.");
    }
  }

  async function moveQuestion(q){
    const targetSectionId = questionMoveTargets[q.id];
    if(!targetSectionId || targetSectionId === q.section_id) return alert("Select a different section first.");

    try {
      await moveQuestionToSection({
        questionId: q.id,
        targetSectionId
      });
      setQuestionMoveTargets({ ...questionMoveTargets, [q.id]: "" });
      await reload();
    } catch (error) {
      alert(error.message || "Could not move question.");
    }
  }

  async function clearSelectedIndustryForm(){
    const industry = data.industries.find(i => i.id === industryId);
    if(!sections.length && !questions.length){
      alert("This industry does not have a form to clear.");
      return;
    }

    const optionCount = data.options.filter(o => questions.some(q => q.id === o.question_id)).length;
    const confirmed = confirm(
      `Clear entire form for "${industry?.name || "selected industry"}"?\n\nThis will delete ${sections.length} sections, ${questions.length} questions and ${optionCount} options.\n\nExisting submissions and reports will not be deleted.`
    );

    if(!confirmed) return;

    const typed = prompt(`Type CLEAR to confirm clearing the form for ${industry?.name || "this industry"}.`);
    if(typed !== "CLEAR") return;

    try {
      const result = await clearIndustryForm(industryId);
      alert(`Form cleared: ${result.sections} sections, ${result.questions} questions and ${result.options} options deleted.`);
      setActiveSection("");
      await reload();
    } catch (error) {
      alert(error.message || "Could not clear form.");
    }
  }

  return (
    <>
      <div className="pageHead">
        <div>
          <h1>Form Builder</h1>
          <p className="muted">Create and edit forms visually with sections, question cards, options and scores.</p>
        </div>
        <button className="btn primary" onClick={() => setEditingQuestion({ mode: "new", industry_id: industryId, section_id: activeSectionId })}>+ Add Question</button>
      </div>

      <div className="builderShell">
        <aside className="builderSide">
          <label>Category</label>
          <select value={industryId} onChange={e => { setIndustryId(e.target.value); setActiveSection(""); }}>
            {data.industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        <DuplicateFormBox industries={data.industries} sourceIndustryId={industryId} reload={reload} />
        <button type="button" className="btn secondary full" onClick={clearSelectedIndustryForm}>
          Clear Entire Form
        </button>
        <h3>Sections</h3>
          {sections.map(s => (
            <button key={s.id} className={activeSectionId === s.id ? "sectionTab active" : "sectionTab"} onClick={() => setActiveSection(s.id)}>
              <b>{s.title}</b>
              <span>{questions.filter(q => q.section_id === s.id).length} questions</span>
            </button>
          ))}

          <form className="miniForm" onSubmit={addSection}>
            <input placeholder="New section title" value={newSection.title} onChange={e => setNewSection({ ...newSection, title: e.target.value })} />
            <textarea placeholder="Section description" value={newSection.description} onChange={e => setNewSection({ ...newSection, description: e.target.value })} />
            <button className="btn secondary full">+ Add Section</button>
          </form>
        </aside>

        <main className="builderMain">
          <FormHealthCheck sections={sections} questions={questions} options={data.options} />

          {sectionObj ? (
            <SectionEditor
              section={sectionObj}
              onSave={saveSection}
              onDuplicate={handleDuplicateSection}
              onDelete={startDeleteSection}
            />
          ) : (
            <div className="emptyState">Create a section first.</div>
          )}

          <div className="questionCards">
            {questions.filter(q => q.section_id === activeSectionId).sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)).map(q => {
              const qOptions = data.options.filter(o => o.question_id === q.id);
              return (
                <div className={!q.is_active ? "questionCard hiddenQ" : "questionCard"} key={q.id}>
                  <div className="questionCardTop">
                    <div>
                      <span className="qType">{TYPE_LABELS[q.question_type] || q.question_type}</span>
                      <h3>{q.question_text}</h3>
                      {q.help_text && <p>{q.help_text}</p>}
                    </div>
                    <div className="qActions">
                      <button onClick={() => setEditingQuestion({ mode: "edit", question: q, options: qOptions })}>Edit</button>
                      <button onClick={() => duplicateQuestion(q)}>Duplicate</button>
                      <button onClick={() => toggleQuestion(q)}>{q.is_active ? "Hide" : "Show"}</button>
                      <button onClick={() => deleteQuestion(q.id)}>Delete</button>
                    </div>
                  </div>

                  <div className="formActions">
                    <select
                      value={questionMoveTargets[q.id] || ""}
                      onChange={e => setQuestionMoveTargets({ ...questionMoveTargets, [q.id]: e.target.value })}
                    >
                      <option value="">Move to section</option>
                      {sections
                        .filter(s => s.id !== q.section_id)
                        .map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                    <button type="button" className="btn secondary" onClick={() => moveQuestion(q)}>Move Question</button>
                  </div>

                  {["single","multiple","select"].includes(q.question_type) && (
                    <div className="previewOptions">
                      {qOptions.map(o => <div className="previewOpt" key={o.id}><span>{o.option_text}</span><small>Score: {o.score || 0}</small></div>)}
                    </div>
                  )}

                  <div className="qMeta">Key: {q.question_key || "-"} | Weight: {q.weight || 1} | {q.is_required ? "Required" : "Optional"}</div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {editingQuestion && (
        <QuestionEditor
          data={editingQuestion}
          sections={sections}
          allQuestions={questions}
          reload={reload}
          close={() => setEditingQuestion(null)}
        />
      )}

      {deleteSectionDraft && (
        <div className="modalBackdrop">
          <div className="modal">
            <button className="modalClose" onClick={() => setDeleteSectionDraft(null)}>Ã—</button>
            <h2>Delete Section</h2>
            <p>
              <b>{deleteSectionDraft.section.title}</b> has {deleteSectionDraft.questions} questions and {deleteSectionDraft.options} options.
            </p>
            <p className="muted">Choose how to handle existing questions before deleting this section.</p>

            <label>Move questions to</label>
            <select value={moveTargetSectionId} onChange={e => setMoveTargetSectionId(e.target.value)}>
              {sections
                .filter(s => s.id !== deleteSectionDraft.section.id)
                .map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>

            <div className="modalActions">
              <button type="button" className="btn secondary" onClick={() => setDeleteSectionDraft(null)}>Cancel</button>
              <button type="button" className="btn secondary" onClick={confirmDeleteSectionWithChildren}>Delete Everything</button>
              <button type="button" className="btn primary" onClick={confirmMoveAndDeleteSection}>Move Questions & Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
