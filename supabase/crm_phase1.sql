-- OnlinDC CRM Phase 1
-- Manual CRM and follow-up task system. Run in Supabase SQL Editor.

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid unique references public.submissions(id) on delete cascade,
  industry_id uuid references public.industries(id) on delete set null,
  status text default 'New',
  priority_score int default 0,
  priority_label text default 'New Lead',
  detected_pain_points text[] default '{}',
  notes text,
  next_followup_at timestamptz,
  last_contacted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crm_followup_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  industry_id uuid references public.industries(id) on delete cascade,
  pain_code text,
  stage_slug text,
  day_offset int default 0,
  channel text default 'whatsapp',
  message text not null,
  creative_url text,
  video_url text,
  priority int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crm_followup_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete cascade,
  template_id uuid references public.crm_followup_templates(id) on delete set null,
  sequence_day int default 0,
  title text not null,
  channel text default 'whatsapp',
  due_at timestamptz not null,
  status text default 'Pending',
  message text,
  creative_url text,
  video_url text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crm_followup_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete cascade,
  task_id uuid references public.crm_followup_tasks(id) on delete set null,
  event_type text not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_crm_leads_submission on public.crm_leads(submission_id);
create index if not exists idx_crm_leads_status on public.crm_leads(status);
create index if not exists idx_crm_followup_tasks_lead on public.crm_followup_tasks(lead_id);
create index if not exists idx_crm_followup_tasks_due on public.crm_followup_tasks(due_at, status);
create index if not exists idx_crm_followup_events_lead on public.crm_followup_events(lead_id);

alter table public.crm_leads disable row level security;
alter table public.crm_followup_templates disable row level security;
alter table public.crm_followup_tasks disable row level security;
alter table public.crm_followup_events disable row level security;

insert into public.crm_followup_templates
(title, day_offset, channel, message, priority, is_active)
values
('Report delivery', 0, 'whatsapp', 'Hello {{owner_name}}, your Onlin Business Diagnostic Report is ready: {{report_url}}', 100, true),
('Problem-specific help', 2, 'whatsapp', 'Your report shows {{pain_point}}. Onlin can help reduce this with a more structured digital commerce flow.', 90, true),
('Similar business example', 5, 'whatsapp', 'Here is a relevant example of how a similar business can present products better online. Want me to show this for {{business_name}}?', 80, true),
('Feature education', 9, 'whatsapp', 'One useful Onlin feature for your current stage is a structured product catalogue/storefront so customers can browse without repeated manual follow-up.', 70, true),
('Soft demo invite', 15, 'whatsapp', 'Would you like a quick demo showing how Onlin can work for {{business_name}} specifically?', 60, true),
('Nurture check-in', 30, 'whatsapp', 'Checking in with one practical idea: organize your products into clear collections and share one catalogue link instead of sending photos repeatedly.', 50, true)
on conflict do nothing;
