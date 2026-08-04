-- OnlinDC CRM V2
-- Standalone lead management for diagnostic, manual, cold-call and referral leads.

begin;

alter table public.crm_leads
  alter column submission_id drop not null;

alter table public.crm_leads
  add column if not exists business_name text,
  add column if not exists contact_name text,
  add column if not exists phone text,
  add column if not exists normalized_phone text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists source text default 'Manual',
  add column if not exists source_detail text,
  add column if not exists stage text default 'New',
  add column if not exists temperature text default 'Warm',
  add column if not exists requirements text,
  add column if not exists estimated_value numeric(12,2),
  add column if not exists lost_reason text,
  add column if not exists assigned_to text,
  add column if not exists next_action text,
  add column if not exists diagnostic_score numeric(5,2),
  add column if not exists last_activity_at timestamptz;

update public.crm_leads l
set
  business_name = coalesce(l.business_name, s.business_name),
  contact_name = coalesce(l.contact_name, s.owner_name),
  phone = coalesce(l.phone, s.phone),
  normalized_phone = coalesce(
    l.normalized_phone,
    nullif(regexp_replace(coalesce(s.phone, ''), '\D', '', 'g'), '')
  ),
  email = coalesce(l.email, s.email),
  source = case when l.submission_id is not null then 'Diagnostic' else coalesce(l.source, 'Manual') end,
  stage = coalesce(l.stage, l.status, 'New'),
  diagnostic_score = coalesce(l.diagnostic_score, s.score_percentage),
  last_activity_at = coalesce(l.last_activity_at, l.last_contacted_at, l.created_at)
from public.submissions s
where l.submission_id = s.id;

update public.crm_leads
set
  business_name = coalesce(nullif(trim(business_name), ''), 'Unnamed Business'),
  source = coalesce(nullif(trim(source), ''), 'Manual'),
  stage = coalesce(nullif(trim(stage), ''), status, 'New'),
  normalized_phone = coalesce(
    normalized_phone,
    nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '')
  );

-- Preserve pipeline positions from CRM V1, whose stage lived in `status`.
update public.crm_leads
set stage = status
where status is not null
  and trim(status) <> ''
  and (stage is null or stage = 'New');

alter table public.crm_followup_tasks
  add column if not exists description text,
  add column if not exists outcome text,
  add column if not exists rescheduled_from timestamptz,
  add column if not exists assigned_to text;

alter table public.crm_followup_events
  add column if not exists channel text,
  add column if not exists outcome text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists occurred_at timestamptz default now();

update public.crm_followup_events
set occurred_at = coalesce(occurred_at, created_at)
where occurred_at is null;

create index if not exists idx_crm_leads_phone on public.crm_leads(normalized_phone);
create index if not exists idx_crm_leads_stage on public.crm_leads(stage);
create index if not exists idx_crm_leads_source on public.crm_leads(source);
create index if not exists idx_crm_leads_next_followup on public.crm_leads(next_followup_at);
create index if not exists idx_crm_events_occurred on public.crm_followup_events(occurred_at desc);

alter table public.crm_leads enable row level security;
alter table public.crm_followup_templates enable row level security;
alter table public.crm_followup_tasks enable row level security;
alter table public.crm_followup_events enable row level security;

drop policy if exists "Authenticated admins manage CRM leads" on public.crm_leads;
create policy "Authenticated admins manage CRM leads" on public.crm_leads
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated admins manage CRM templates" on public.crm_followup_templates;
create policy "Authenticated admins manage CRM templates" on public.crm_followup_templates
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated admins manage CRM tasks" on public.crm_followup_tasks;
create policy "Authenticated admins manage CRM tasks" on public.crm_followup_tasks
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated admins manage CRM events" on public.crm_followup_events;
create policy "Authenticated admins manage CRM events" on public.crm_followup_events
  for all to authenticated using (true) with check (true);

commit;
