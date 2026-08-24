import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { slugify, stageFromScore } from "../utils/reportUtils";

export default function PublicDiagnostic(){
  const [industries, setIndustries] = useState([]);
  const [industryId, setIndustryId] = useState("");
  const [industry, setIndustry] = useState(null);
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { loadIndustries(); }, []);

  useEffect(() => {
    if (!industries.length || industryId) return;
    const requestedIndustry = new URLSearchParams(window.location.search).get("industry")?.toLowerCase();
    const match = industries.find((item) => item.slug === requestedIndustry);
    if (match) setIndustryId(match.id);
  }, [industries, industryId]);

  async function loadIndustries(){
    const { data, error } = await supabase
      .from("industries")
      .select("*")
      .in("slug", ["fashion", "jewellery"])
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if(error) return setError(error.message);
    setIndustries(data || []);
  }

  async function start(){
    if(!industryId) return alert("Please select your business category.");
    setLoading(true);
    setError("");

    const industryObj = industries.find(i => i.id === industryId);
    setIndustry(industryObj);

    const [secRes, qRes] = await Promise.all([
      supabase.from("question_sections").select("*").eq("industry_id", industryId).eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("questions").select("*").eq("industry_id", industryId).eq("is_active", true).order("sort_order", { ascending: true })
    ]);

    if(secRes.error){ setError(secRes.error.message); setLoading(false); return; }
    if(qRes.error){ setError(qRes.error.message); setLoading(false); return; }

    const qIds = (qRes.data || []).map(q => q.id);
    let optData = [];

    if(qIds.length){
      const optRes = await supabase
        .from("question_options")
        .select("*")
        .in("question_id", qIds)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if(optRes.error){ setError(optRes.error.message); setLoading(false); return; }
      optData = optRes.data || [];
    }

    if(!secRes.data?.length || !qRes.data?.length){
      setError("No form is configured for this category yet.");
      setLoading(false);
      return;
    }

    setSections(secRes.data || []);
    setQuestions(qRes.data || []);
    setOptions(optData);
    setAnswers({});
    setStep(0);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const currentSection = sections[step];
  const currentQuestions = useMemo(() => {
    if(!currentSection) return [];
    return questions.filter(q => q.section_id === currentSection.id);
  }, [questions, currentSection]);

  function updateText(q, value){
    setAnswers(prev => ({
      ...prev,
      [q.id]: { question: q, answer_text: value, selected_options: [], score: 0 }
    }));
  }

  function updateOption(q, option, checked){
    setAnswers(prev => {
      const existing = prev[q.id]?.selected_options || [];
      let selected = [];

      if(q.question_type === "multiple"){
        const maxSelections = Number(q.validation_rules?.max_selections || 0);
        if(checked && maxSelections && existing.length >= maxSelections){
          alert(`Choose up to ${maxSelections} options for this question.`);
          return prev;
        }
        selected = checked ? [...existing, option] : existing.filter(o => o.id !== option.id);
      } else {
        selected = [option];
      }

      const baseScore = selected.reduce((sum, o) => sum + Number(o.score || 0), 0);
      const score = baseScore * Number(q.weight || 1);

      return {
        ...prev,
        [q.id]: { question: q, answer_text: "", selected_options: selected, score }
      };
    });
  }

  function isChecked(q, option){
    return (answers[q.id]?.selected_options || []).some(o => o.id === option.id);
  }

  function validate(){
    for(const q of currentQuestions){
      if(!q.is_required) continue;
      const ans = answers[q.id];

      if(["text","email","phone","number","textarea"].includes(q.question_type)){
        if(!ans?.answer_text?.trim()){
          alert("Please answer: " + q.question_text);
          return false;
        }
      }

      if(["single","multiple","select"].includes(q.question_type)){
        if(!ans?.selected_options?.length){
          alert("Please select: " + q.question_text);
          return false;
        }
      }
    }

    return true;
  }

  function calculateScore(){
    const totalScore = Object.values(answers).reduce((sum, a) => sum + Number(a.score || 0), 0);
    let maxScore = 0;

    questions.forEach(q => {
      const qOptions = options.filter(o => o.question_id === q.id);
      const weight = Number(q.weight || 1);

      if(q.question_type === "multiple"){
        maxScore += qOptions.reduce((sum, o) => sum + Number(o.score || 0), 0) * weight;
      } else if(["single","select"].includes(q.question_type)){
        maxScore += Math.max(0, ...qOptions.map(o => Number(o.score || 0))) * weight;
      }
    });

    return {
      totalScore,
      maxScore,
      percentage: maxScore ? Math.round((totalScore / maxScore) * 100) : 0
    };
  }

  function getAnswerByKey(key){
    const found = Object.values(answers).find(a => a.question.question_key === key);
    if(!found) return "";
    if(found.answer_text) return found.answer_text;
    return (found.selected_options || []).map(o => o.option_text).join(", ");
  }

  async function submit(){
    if(submitting) return;
    setSubmitting(true);
    setError("");

    const score = calculateScore();
    const stage = stageFromScore(score.percentage);
    const businessName = getAnswerByKey("business_name") || "Your Business";
    const ownerName = getAnswerByKey("owner_name") || "";
    const phone = getAnswerByKey("phone") || "";
    const email = getAnswerByKey("email") || "";
    const reportSlug = `${slugify(businessName)}-${Date.now().toString(36)}`;
    const reportUrl = `${window.location.origin}/report/${reportSlug}`;
    const agentCode = new URLSearchParams(window.location.search).get("agent");
    let sourceAgentId = null;
    if (agentCode) {
      const { data } = await supabase.rpc("resolve_sales_agent_code", { code_value: agentCode });
      sourceAgentId = data || null;
    }

    const summary = `${businessName} currently has a ${score.percentage}% digital readiness score. This means the business is at the "${stage}" stage and can grow faster with a more structured digital commerce system.`;

    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .insert({
        industry_id: industryId,
        business_name: businessName,
        owner_name: ownerName,
        phone,
        email,
        total_score: score.totalScore,
        score_percentage: score.percentage,
        readiness_stage: stage,
        report_summary: summary,
        report_slug: reportSlug,
        report_url: reportUrl,
        source_agent_id: sourceAgentId,
        report_generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if(subError){ setError(subError.message); setSubmitting(false); return; }

    const rows = Object.values(answers).map(a => ({
      submission_id: submission.id,
      question_id: a.question.id,
      answer_text: a.answer_text || null,
      selected_option_texts: (a.selected_options || []).map(o => o.option_text),
      score: a.score || 0
    }));

    if(rows.length){
      const { error: ansError } = await supabase.from("submission_answers").insert(rows);
      if(ansError){ setError(ansError.message); setSubmitting(false); return; }
    }

    setReport({ businessName, ownerName, score, stage, summary, reportUrl, reportSlug, industry: industry?.name });
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next(){
    if(submitting) return;
    if(!validate()) return;
    if(step < sections.length - 1){
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submit();
    }
  }

  if(report){
    return (
      <div className="publicApp">
        <TopBar />
        <section className="publicHero small">
          <span>Report Ready</span>
          <h1>{report.businessName}</h1>
          <p>{report.summary}</p>
        </section>

        <section className="publicPanel">
          <div className="resultScore"><b>{report.score.percentage}%</b><span>{report.stage}</span></div>
          <a className="btn primary full" href={report.reportUrl}>Open Shareable Report</a>
          <button className="btn secondary full" onClick={() => navigator.clipboard.writeText(report.reportUrl)}>Copy Report Link</button>
          <button className="btn secondary full" onClick={() => location.reload()}>Take Another Test</button>
        </section>
      </div>
    );
  }

  return (
    <div className="publicApp">
      <TopBar />

      <section className="publicHero">
        <span>Digital Readiness Test</span>
        <h1>Know where your business stands today.</h1>
        <p>Get a smart report on your current digital maturity, gaps, and how Onlin can become your growth catalyst.</p>
      </section>

      {error && (
        <section className="publicPanel errorBox">
          <h2>Something needs attention</h2>
          <p>{error}</p>
          <button className="btn secondary full" onClick={() => location.reload()}>Restart</button>
        </section>
      )}

      {step === -1 && !error && (
        <section className="publicPanel">
          <h2>Select your business category</h2>
          <p className="muted">The diagnostic will adjust based on your selected industry.</p>
          <label>Business Category</label>
          <select value={industryId} onChange={e => setIndustryId(e.target.value)}>
            <option value="">Select category</option>
            {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <button className="btn primary full" onClick={start} disabled={loading}>{loading ? "Loading..." : "Start Diagnostic"}</button>
        </section>
      )}

      {step >= 0 && !error && (
        <section className="publicPanel">
          <div className="progressLine"><div style={{ width: `${Math.round(((step + 1) / sections.length) * 100)}%` }} /></div>
          <span className="stepText">{step + 1}/{sections.length}</span>
          <h2>{currentSection?.title}</h2>
          <p className="muted">{currentSection?.description}</p>

          {currentQuestions.map(q => {
            const qOptions = options.filter(o => o.question_id === q.id);
            return (
              <div className="questionBlock" key={q.id}>
                <label>{q.question_text}{q.is_required ? " *" : ""}</label>
                {q.help_text && <p className="helpText">{q.help_text}</p>}

                {["text","email","phone","number"].includes(q.question_type) && (
                  <input
                    type={q.question_type === "phone" ? "tel" : q.question_type}
                    placeholder={q.placeholder || ""}
                    value={answers[q.id]?.answer_text || ""}
                    onChange={e => updateText(q, e.target.value)}
                  />
                )}

                {q.question_type === "textarea" && (
                  <textarea
                    placeholder={q.placeholder || ""}
                    value={answers[q.id]?.answer_text || ""}
                    onChange={e => updateText(q, e.target.value)}
                  />
                )}

                {["single","multiple","select"].includes(q.question_type) && (
                  <div className="options">
                    {qOptions.map(opt => (
                      <label className="option" key={opt.id}>
                        <input
                          type={q.question_type === "multiple" ? "checkbox" : "radio"}
                          name={q.id}
                          checked={isChecked(q,opt)}
                          onChange={e => updateOption(q,opt,e.target.checked)}
                        />
                        <span>{opt.option_text}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="stickyActions">
            <button className="btn secondary" onClick={() => step === 0 ? setStep(-1) : setStep(step - 1)}>
              {step === 0 ? "Change Category" : "Back"}
            </button>
            <button className="btn primary" onClick={next} disabled={submitting}>
              {submitting ? "Generating..." : step === sections.length - 1 ? "Generate Report" : "Next"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function TopBar(){
  return (
    <div className="topBar">
      <div className="brandMark">Onlin.in</div>
    </div>
  );
}
