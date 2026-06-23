import React from "react";

export default function SubmissionModal({ submission, answers, onClose }){
  return (
    <div className="modalBackdrop">
      <div className="modal">
        <button className="modalClose" onClick={onClose}>×</button>
        <div className="printArea">
          <h1>{submission.business_name}</h1>
          <p><b>Owner:</b> {submission.owner_name} | <b>Phone:</b> {submission.phone}</p>
          <p><b>Score:</b> {submission.score_percentage}% | <b>Stage:</b> {submission.readiness_stage}</p>
          <div className="resultCard"><h3>Report Summary</h3><p>{submission.report_summary}</p></div>
          <h3>Submitted Answers</h3>
          {answers.map(a => (
            <div className="answerLine" key={a.id}>
              <b>{a.questions?.question_text || "Question"}</b>
              <p>{a.answer_text || a.selected_option_texts?.join(", ")}</p>
            </div>
          ))}
        </div>
        <button className="btn primary full" onClick={() => window.print()}>Print Report</button>
      </div>
    </div>
  );
}
