-- Local/MVP testing only. Do not use this for final production.
alter table public.submissions disable row level security;
alter table public.submission_answers disable row level security;
alter table public.industries disable row level security;
alter table public.question_sections disable row level security;
alter table public.questions disable row level security;
alter table public.question_options disable row level security;
alter table public.knowledge_items disable row level security;
alter table public.features_library disable row level security;
alter table public.report_assets disable row level security;
alter table public.generated_reports disable row level security;
alter table public.report_view_events disable row level security;
