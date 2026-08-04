import { supabase } from "../../services/supabase";

export const initialAdminData = {
  submissions: [],
  answers: [],
  industries: [],
  sections: [],
  questions: [],
  options: [],
  knowledge: [],
  features: [],
  useCases: [],
  media: [],
  assets: [],
  featureCategories: [],
  painMaster: [],
  painMappings: [],
  heroFeatures: [],
  crmLeads: [],
  crmTemplates: [],
  crmTasks: [],
  crmEvents: [],
  salesAgents: [],
  salesTeams: [],
  leadAssignments: []
};

export async function loadAdminData(){
  const [subRes, ansRes, indRes, secRes, qRes, optRes, kRes, fRes, ucRes, mediaRes, assetRes, catRes, painRes, mapRes, heroRes, crmLeadRes, crmTemplateRes, crmTaskRes, crmEventRes, agentRes, teamRes, assignmentRes] = await Promise.all([
    supabase.from("submissions").select("*, industries(name)").order("created_at", { ascending: false }),
    supabase.from("submission_answers").select("*, questions(question_text, question_key)").order("created_at", { ascending: true }),
    supabase.from("industries").select("*").order("sort_order", { ascending: true }),
    supabase.from("question_sections").select("*, industries(name)").order("sort_order", { ascending: true }),
    supabase.from("questions").select("*, industries(name), question_sections(title)").order("sort_order", { ascending: true }),
    supabase.from("question_options").select("*").order("sort_order", { ascending: true }),
    supabase.from("knowledge_items").select("*, industries(name), features_library(name), feature_use_cases(title)").order("priority", { ascending: false }),
    supabase.from("features_library").select("*").order("priority", { ascending: false }),
    supabase.from("feature_use_cases").select("*, industries(name), features_library(name)").order("priority", { ascending: false }),
    supabase.from("feature_media").select("*, features_library(name)").order("sort_order", { ascending: true }),
    supabase.from("report_assets").select("*, industries(name)").order("priority", { ascending: false }),
    supabase.from("feature_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("pain_points_master").select("*").order("priority", { ascending: false }),
    supabase.from("pain_point_feature_mapping").select("*, industries(name), features_library(name)").order("priority", { ascending: false }),
    supabase.from("industry_hero_features").select("*, industries(name), features_library(name)").order("hero_score", { ascending: false }),
    supabase.from("crm_leads").select("*, industries(name), submissions(*, industries(name))").order("priority_score", { ascending: false }),
    supabase.from("crm_followup_templates").select("*").eq("is_active", true).order("day_offset", { ascending: true }),
    supabase.from("crm_followup_tasks").select("*").order("due_at", { ascending: true }),
    supabase.from("crm_followup_events").select("*").order("created_at", { ascending: false }),
    supabase.from("sales_agents").select("*, sales_teams(name)").order("full_name"),
    supabase.from("sales_teams").select("*").order("name"),
    supabase.from("lead_assignments").select("*").order("created_at", { ascending: false })
  ]);

  return {
    submissions: subRes.data || [],
    answers: ansRes.data || [],
    industries: indRes.data || [],
    sections: secRes.data || [],
    questions: qRes.data || [],
    options: optRes.data || [],
    knowledge: kRes.data || [],
    features: fRes.data || [],
    useCases: ucRes.data || [],
    media: mediaRes.data || [],
    assets: assetRes.data || [],
    featureCategories: catRes.data || [],
    painMaster: painRes.data || [],
    painMappings: mapRes.data || [],
    heroFeatures: heroRes.data || [],
    crmLeads: crmLeadRes.data || [],
    crmTemplates: crmTemplateRes.data || [],
    crmTasks: crmTaskRes.data || [],
    crmEvents: crmEventRes.data || [],
    salesAgents: agentRes.data || [],
    salesTeams: teamRes.data || [],
    leadAssignments: assignmentRes.data || []
  };
}
