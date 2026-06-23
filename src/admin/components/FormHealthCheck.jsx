import React from "react";

const REQUIRED_KEYS = ["business_name", "owner_name", "phone", "email", "pain_points"];
const CHOICE_TYPES = ["single", "multiple", "select"];

export default function FormHealthCheck({ sections, questions, options }) {
  const activeQuestions = questions.filter((question) => question.is_active !== false);
  const existingKeys = new Set(activeQuestions.map((question) => question.question_key).filter(Boolean));
  const missingKeys = REQUIRED_KEYS.filter((key) => !existingKeys.has(key));
  const duplicateKeys = Object.entries(
    activeQuestions.reduce((acc, question) => {
      if (!question.question_key) return acc;
      acc[question.question_key] = (acc[question.question_key] || 0) + 1;
      return acc;
    }, {})
  ).filter(([, count]) => count > 1);

  const emptySections = sections.filter((section) => {
    return !activeQuestions.some((question) => question.section_id === section.id);
  });

  const questionsWithoutOptions = activeQuestions.filter((question) => {
    if (!CHOICE_TYPES.includes(question.question_type)) return false;
    return !options.some((option) => option.question_id === question.id && option.is_active !== false);
  });

  const maxScore = activeQuestions.reduce((total, question) => {
    const questionOptions = options.filter((option) => option.question_id === question.id && option.is_active !== false);
    const weight = Number(question.weight || 1);

    if (question.question_type === "multiple") {
      return total + questionOptions.reduce((sum, option) => sum + Number(option.score || 0), 0) * weight;
    }

    if (CHOICE_TYPES.includes(question.question_type)) {
      return total + Math.max(0, ...questionOptions.map((option) => Number(option.score || 0))) * weight;
    }

    return total;
  }, 0);

  const issueCount = missingKeys.length + duplicateKeys.length + emptySections.length + questionsWithoutOptions.length;

  return (
    <div className="adminCard">
      <div className="pageHead">
        <div>
          <h3>Form Health Check</h3>
          <p className="muted">
            {issueCount ? `${issueCount} item(s) need attention before publishing.` : "No major setup issues found."}
          </p>
        </div>
        <div className="kpi">
          <b>{maxScore}</b>
          <span>Max Score</span>
        </div>
      </div>

      <div className="reportGrid">
        <div className={missingKeys.length ? "insightCard danger" : "insightCard good"}>
          <h3>Required Keys</h3>
          <p>{missingKeys.length ? `Missing: ${missingKeys.join(", ")}` : "All required keys are present."}</p>
        </div>

        <div className={duplicateKeys.length ? "insightCard danger" : "insightCard good"}>
          <h3>Duplicate Keys</h3>
          <p>{duplicateKeys.length ? duplicateKeys.map(([key]) => key).join(", ") : "No duplicate question keys."}</p>
        </div>

        <div className={emptySections.length ? "insightCard warn" : "insightCard good"}>
          <h3>Empty Sections</h3>
          <p>{emptySections.length ? emptySections.map((section) => section.title).join(", ") : "Every section has active questions."}</p>
        </div>

        <div className={questionsWithoutOptions.length ? "insightCard danger" : "insightCard good"}>
          <h3>Choice Questions</h3>
          <p>
            {questionsWithoutOptions.length
              ? `${questionsWithoutOptions.length} choice question(s) have no active options.`
              : "All choice questions have active options."}
          </p>
        </div>
      </div>
    </div>
  );
}
