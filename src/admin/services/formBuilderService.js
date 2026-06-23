import { supabase } from "../../services/supabase";

function stripSystemFields(row, extraFields = []) {
  const {
    id,
    created_at,
    updated_at,
    industries,
    question_sections,
    questions,
    ...payload
  } = row;

  extraFields.forEach((field) => {
    delete payload[field];
  });

  return payload;
}

export async function duplicateIndustryForm({ sourceIndustryId, targetIndustryId }) {
  if (!sourceIndustryId || !targetIndustryId) {
    throw new Error("Please select both source and target industry.");
  }

  if (sourceIndustryId === targetIndustryId) {
    throw new Error("Source and target industry cannot be the same.");
  }

  const { data: sourceSections, error: sectionError } = await supabase
    .from("question_sections")
    .select("*")
    .eq("industry_id", sourceIndustryId)
    .order("sort_order", { ascending: true });

  if (sectionError) throw sectionError;

  const { data: sourceQuestions, error: questionError } = await supabase
    .from("questions")
    .select("*")
    .eq("industry_id", sourceIndustryId)
    .order("sort_order", { ascending: true });

  if (questionError) throw questionError;

  if (!(sourceSections || []).length || !(sourceQuestions || []).length) {
    throw new Error("The selected source industry does not have a form to duplicate.");
  }

  const sourceQuestionIds = (sourceQuestions || []).map((q) => q.id);

  let sourceOptions = [];
  if (sourceQuestionIds.length) {
    const { data: optionRows, error: optionError } = await supabase
      .from("question_options")
      .select("*")
      .in("question_id", sourceQuestionIds)
      .order("sort_order", { ascending: true });

    if (optionError) throw optionError;
    sourceOptions = optionRows || [];
  }

  const [targetSectionRes, targetQuestionRes] = await Promise.all([
    supabase
      .from("question_sections")
      .select("*")
      .eq("industry_id", targetIndustryId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("questions")
      .select("*")
      .eq("industry_id", targetIndustryId)
      .order("sort_order", { ascending: true })
  ]);

  if (targetSectionRes.error) throw targetSectionRes.error;
  if (targetQuestionRes.error) throw targetQuestionRes.error;

  const targetSections = targetSectionRes.data || [];
  const targetQuestions = targetQuestionRes.data || [];
  const targetQuestionIds = targetQuestions.map((q) => q.id);

  let targetOptions = [];
  if (targetQuestionIds.length) {
    const { data: optionRows, error: optionError } = await supabase
      .from("question_options")
      .select("*")
      .in("question_id", targetQuestionIds)
      .order("sort_order", { ascending: true });

    if (optionError) throw optionError;
    targetOptions = optionRows || [];
  }

  const sectionMap = {};
  const questionMap = {};
  const counts = {
    sections: { copied: 0, skipped: 0 },
    questions: { copied: 0, skipped: 0 },
    options: { copied: 0, skipped: 0 }
  };

  const normalize = (value) => String(value || "").trim().toLowerCase();
  const sectionKey = (section) => [
    normalize(section.title),
    Number(section.sort_order || 0)
  ].join("|");
  const questionKey = (question, sectionId) => [
    sectionId || "",
    normalize(question.question_key),
    normalize(question.question_text),
    normalize(question.question_type),
    Number(question.sort_order || 0)
  ].join("|");
  const optionKey = (option, questionId) => [
    questionId || "",
    normalize(option.option_text),
    normalize(option.option_value),
    Number(option.sort_order || 0)
  ].join("|");

  const targetSectionByKey = new Map(targetSections.map((section) => [sectionKey(section), section]));
  const targetQuestionByKey = new Map(
    targetQuestions.map((question) => [questionKey(question, question.section_id), question])
  );
  const targetOptionByKey = new Map(
    targetOptions.map((option) => [optionKey(option, option.question_id), option])
  );

  for (const section of sourceSections || []) {
    const { id, created_at, updated_at, industries, ...payload } = section;
    const existingSection = targetSectionByKey.get(sectionKey(section));

    if (existingSection) {
      sectionMap[id] = existingSection.id;
      counts.sections.skipped += 1;
      continue;
    }

    const { data: newSection, error } = await supabase
      .from("question_sections")
      .insert({
        ...payload,
        industry_id: targetIndustryId,
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== false
      })
      .select()
      .single();

    if (error) throw error;
    sectionMap[id] = newSection.id;
    targetSectionByKey.set(sectionKey(newSection), newSection);
    counts.sections.copied += 1;
  }

  for (const question of sourceQuestions || []) {
    const { id, created_at, updated_at, question_sections, industries, ...payload } = question;
    const mappedSectionId = payload.section_id ? sectionMap[payload.section_id] || null : null;
    const existingQuestion = targetQuestionByKey.get(questionKey(question, mappedSectionId));

    if (existingQuestion) {
      questionMap[id] = existingQuestion.id;
      counts.questions.skipped += 1;
      continue;
    }

    const { data: newQuestion, error } = await supabase
      .from("questions")
      .insert({
        ...payload,
        industry_id: targetIndustryId,
        section_id: mappedSectionId,
        sort_order: payload.sort_order || 0,
        is_required: payload.is_required !== false,
        is_active: payload.is_active !== false
      })
      .select()
      .single();

    if (error) throw error;
    questionMap[id] = newQuestion.id;
    targetQuestionByKey.set(questionKey(newQuestion, newQuestion.section_id), newQuestion);
    counts.questions.copied += 1;
  }

  for (const option of sourceOptions || []) {
    const { id, created_at, updated_at, questions, ...payload } = option;
    const mappedQuestionId = questionMap[payload.question_id];
    if (!mappedQuestionId) continue;
    const existingOption = targetOptionByKey.get(optionKey(option, mappedQuestionId));

    if (existingOption) {
      counts.options.skipped += 1;
      continue;
    }

    const { data: newOption, error } = await supabase
      .from("question_options")
      .insert({
        ...payload,
        question_id: mappedQuestionId,
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== false
      })
      .select()
      .single();

    if (error) throw error;
    targetOptionByKey.set(optionKey(newOption, newOption.question_id), newOption);
    counts.options.copied += 1;
  }

  return {
    sections: counts.sections,
    questions: counts.questions,
    options: counts.options
  };
}

export async function deleteEmptySection(sectionId) {
  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id")
    .eq("section_id", sectionId);

  if (questionError) throw questionError;
  if ((questions || []).length) {
    throw new Error("This section still has questions. Move or delete them before deleting the section.");
  }

  const { error } = await supabase
    .from("question_sections")
    .delete()
    .eq("id", sectionId);

  if (error) throw error;
}

export async function deleteSectionWithChildren(sectionId) {
  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id")
    .eq("section_id", sectionId);

  if (questionError) throw questionError;

  const questionIds = (questions || []).map((question) => question.id);

  if (questionIds.length) {
    const { error: optionError } = await supabase
      .from("question_options")
      .delete()
      .in("question_id", questionIds);

    if (optionError) throw optionError;

    const { error: deleteQuestionError } = await supabase
      .from("questions")
      .delete()
      .in("id", questionIds);

    if (deleteQuestionError) throw deleteQuestionError;
  }

  const { error } = await supabase
    .from("question_sections")
    .delete()
    .eq("id", sectionId);

  if (error) throw error;

  return { questions: questionIds.length };
}

export async function moveQuestionsAndDeleteSection({ sectionId, targetSectionId }) {
  if (!sectionId || !targetSectionId) {
    throw new Error("Please select a target section.");
  }

  if (sectionId === targetSectionId) {
    throw new Error("Target section must be different from the section being deleted.");
  }

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id")
    .eq("section_id", sectionId);

  if (questionError) throw questionError;

  const questionIds = (questions || []).map((question) => question.id);

  if (questionIds.length) {
    const { error: moveError } = await supabase
      .from("questions")
      .update({
        section_id: targetSectionId,
        updated_at: new Date().toISOString()
      })
      .in("id", questionIds);

    if (moveError) throw moveError;
  }

  const { error } = await supabase
    .from("question_sections")
    .delete()
    .eq("id", sectionId);

  if (error) throw error;

  return { questions: questionIds.length };
}

export async function duplicateSection({ section, questions, options }) {
  if (!section?.id) throw new Error("Select a section to duplicate.");

  const sectionPayload = stripSystemFields(section);
  const { data: newSection, error: sectionError } = await supabase
    .from("question_sections")
    .insert({
      ...sectionPayload,
      title: `${sectionPayload.title || "Section"} (Copy)`,
      sort_order: Number(sectionPayload.sort_order || 0) + 1,
      is_active: sectionPayload.is_active !== false
    })
    .select()
    .single();

  if (sectionError) throw sectionError;

  const questionMap = {};
  const sourceQuestions = (questions || [])
    .filter((question) => question.section_id === section.id)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  for (const question of sourceQuestions) {
    const questionPayload = stripSystemFields(question);
    const { data: newQuestion, error: questionError } = await supabase
      .from("questions")
      .insert({
        ...questionPayload,
        section_id: newSection.id,
        question_text: `${questionPayload.question_text || "Question"} (Copy)`,
        question_key: questionPayload.question_key ? `${questionPayload.question_key}_copy` : "",
        sort_order: questionPayload.sort_order || 0,
        is_required: questionPayload.is_required !== false,
        is_active: questionPayload.is_active !== false
      })
      .select()
      .single();

    if (questionError) throw questionError;
    questionMap[question.id] = newQuestion.id;
  }

  const optionRows = (options || [])
    .filter((option) => questionMap[option.question_id])
    .map((option) => ({
      ...stripSystemFields(option),
      question_id: questionMap[option.question_id],
      sort_order: option.sort_order || 0,
      is_active: option.is_active !== false
    }));

  if (optionRows.length) {
    const { error: optionError } = await supabase
      .from("question_options")
      .insert(optionRows);

    if (optionError) throw optionError;
  }

  return {
    section: newSection,
    questions: sourceQuestions.length,
    options: optionRows.length
  };
}

export async function moveQuestionToSection({ questionId, targetSectionId }) {
  if (!questionId || !targetSectionId) {
    throw new Error("Please select a target section.");
  }

  const { error } = await supabase
    .from("questions")
    .update({
      section_id: targetSectionId,
      updated_at: new Date().toISOString()
    })
    .eq("id", questionId);

  if (error) throw error;
}

export async function clearIndustryForm(industryId) {
  if (!industryId) throw new Error("Select an industry first.");

  const [sectionRes, questionRes] = await Promise.all([
    supabase
      .from("question_sections")
      .select("id")
      .eq("industry_id", industryId),
    supabase
      .from("questions")
      .select("id")
      .eq("industry_id", industryId)
  ]);

  if (sectionRes.error) throw sectionRes.error;
  if (questionRes.error) throw questionRes.error;

  const sectionIds = (sectionRes.data || []).map((section) => section.id);
  const questionIds = (questionRes.data || []).map((question) => question.id);

  let optionCount = 0;
  if (questionIds.length) {
    const { data: options, error: optionLoadError } = await supabase
      .from("question_options")
      .select("id")
      .in("question_id", questionIds);

    if (optionLoadError) throw optionLoadError;
    optionCount = (options || []).length;

    const { error: optionDeleteError } = await supabase
      .from("question_options")
      .delete()
      .in("question_id", questionIds);

    if (optionDeleteError) throw optionDeleteError;

    const { error: questionDeleteError } = await supabase
      .from("questions")
      .delete()
      .in("id", questionIds);

    if (questionDeleteError) throw questionDeleteError;
  }

  if (sectionIds.length) {
    const { error: sectionDeleteError } = await supabase
      .from("question_sections")
      .delete()
      .in("id", sectionIds);

    if (sectionDeleteError) throw sectionDeleteError;
  }

  return {
    sections: sectionIds.length,
    questions: questionIds.length,
    options: optionCount
  };
}
