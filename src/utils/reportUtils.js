export function slugify(text){
  return String(text || "business")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function stageFromScore(score){
  if(score >= 80) return "Future-Ready Business";
  if(score >= 62) return "Growth-Ready Business";
  if(score >= 42) return "Promising but Under-Structured";
  return "High Potential but Too Manual";
}

export function cleanPhone(phone){
  return String(phone || "").replace(/\D/g, "");
}

export function whatsappLink(phone, message){
  const clean = cleanPhone(phone);
  if(!clean) return "#";
  return `https://wa.me/91${clean.slice(-10)}?text=${encodeURIComponent(message)}`;
}

export function extractPainPoints(answers){
  const pain = answers.find(a => a.questions?.question_key === "pain_points");
  return pain?.selected_option_texts || [];
}

export function answerByKey(answers, key){
  const found = answers.find(a => a.questions?.question_key === key);
  if(!found) return "";
  return found.answer_text || (found.selected_option_texts || []).join(", ");
}

export function pickAssets(assets, type, painPoints = [], score = 0){
  return assets
    .filter(a => a.asset_type === type)
    .filter(a => score >= Number(a.score_min || 0) && score <= Number(a.score_max || 100))
    .sort((a,b) => {
      const am = painPoints.includes(a.related_pain_point) ? 1000 : 0;
      const bm = painPoints.includes(b.related_pain_point) ? 1000 : 0;
      return (bm + Number(b.priority || 0)) - (am + Number(a.priority || 0));
    });
}

export function matchesPain(text, painPoints = []){
  if(!text) return false;
  return painPoints.some(p => String(p).toLowerCase() === String(text).toLowerCase());
}

export function prioritySort(a, b){
  return Number(b.priority || 0) - Number(a.priority || 0);
}
