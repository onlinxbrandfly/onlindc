-- OnlinDC multi-agent CRM foundation.
begin;

create table if not exists public.sales_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_agents (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role text not null default 'agent' check (role in ('admin','manager','agent','viewer')),
  team_id uuid references public.sales_teams(id) on delete set null,
  agent_code text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.sales_agents (id, full_name, email, role, agent_code)
select id, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Admin'), email, 'admin',
  upper(substr(replace(id::text, '-', ''), 1, 8))
from auth.users
on conflict (id) do nothing;

alter table public.crm_leads
  add column if not exists assigned_agent_id uuid references public.sales_agents(id) on delete set null,
  add column if not exists created_by_agent_id uuid references public.sales_agents(id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists first_contacted_at timestamptz,
  add column if not exists source_campaign text;

alter table public.crm_followup_tasks
  add column if not exists assigned_agent_id uuid references public.sales_agents(id) on delete set null,
  add column if not exists completed_by_agent_id uuid references public.sales_agents(id) on delete set null;

alter table public.crm_followup_events
  add column if not exists actor_agent_id uuid references public.sales_agents(id) on delete set null;

alter table public.submissions
  add column if not exists source_agent_id uuid references public.sales_agents(id) on delete set null,
  add column if not exists source_campaign text;

create table if not exists public.lead_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  from_agent_id uuid references public.sales_agents(id) on delete set null,
  to_agent_id uuid references public.sales_agents(id) on delete set null,
  assigned_by uuid references public.sales_agents(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_leads_assigned_agent on public.crm_leads(assigned_agent_id);
create index if not exists idx_crm_tasks_assigned_agent on public.crm_followup_tasks(assigned_agent_id);
create index if not exists idx_submissions_source_agent on public.submissions(source_agent_id);
create index if not exists idx_lead_assignments_lead on public.lead_assignments(lead_id, created_at desc);

create or replace function public.is_sales_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.sales_agents where id = auth.uid() and is_active and role in ('admin','manager')); $$;

create or replace function public.resolve_sales_agent_code(code_value text)
returns uuid language sql stable security definer set search_path = public
as $$ select id from public.sales_agents where is_active and upper(agent_code) = upper(trim(code_value)) limit 1; $$;

grant execute on function public.resolve_sales_agent_code(text) to anon, authenticated;

alter table public.sales_agents enable row level security;
alter table public.sales_teams enable row level security;
alter table public.lead_assignments enable row level security;

create policy "Agents read team directory" on public.sales_agents for select to authenticated using (is_active or public.is_sales_admin());
create policy "Admins manage agents" on public.sales_agents for all to authenticated using (public.is_sales_admin()) with check (public.is_sales_admin());
create policy "Authenticated read teams" on public.sales_teams for select to authenticated using (true);
create policy "Admins manage teams" on public.sales_teams for all to authenticated using (public.is_sales_admin()) with check (public.is_sales_admin());
create policy "Visible lead assignment history" on public.lead_assignments for select to authenticated using (public.is_sales_admin() or to_agent_id = auth.uid() or from_agent_id = auth.uid());
create policy "Admins assign leads" on public.lead_assignments for insert to authenticated with check (public.is_sales_admin() or assigned_by = auth.uid());

drop policy if exists "Authenticated admins manage CRM leads" on public.crm_leads;
create policy "Role based CRM leads select" on public.crm_leads for select to authenticated using (public.is_sales_admin() or assigned_agent_id = auth.uid() or created_by_agent_id = auth.uid());
create policy "Role based CRM leads insert" on public.crm_leads for insert to authenticated with check (public.is_sales_admin() or assigned_agent_id = auth.uid() or created_by_agent_id = auth.uid());
create policy "Role based CRM leads update" on public.crm_leads for update to authenticated using (public.is_sales_admin() or assigned_agent_id = auth.uid()) with check (public.is_sales_admin() or assigned_agent_id = auth.uid());
create policy "Admins delete CRM leads" on public.crm_leads for delete to authenticated using (public.is_sales_admin());

drop policy if exists "Authenticated admins manage CRM tasks" on public.crm_followup_tasks;
create policy "Role based CRM tasks select" on public.crm_followup_tasks for select to authenticated using (public.is_sales_admin() or exists(select 1 from public.crm_leads l where l.id = lead_id and (l.assigned_agent_id = auth.uid() or l.created_by_agent_id = auth.uid())));
create policy "Role based CRM tasks insert" on public.crm_followup_tasks for insert to authenticated with check (public.is_sales_admin() or exists(select 1 from public.crm_leads l where l.id = lead_id and l.assigned_agent_id = auth.uid()));
create policy "Role based CRM tasks update" on public.crm_followup_tasks for update to authenticated using (public.is_sales_admin() or exists(select 1 from public.crm_leads l where l.id = lead_id and l.assigned_agent_id = auth.uid()));
create policy "Admins delete CRM tasks" on public.crm_followup_tasks for delete to authenticated using (public.is_sales_admin());

drop policy if exists "Authenticated admins manage CRM events" on public.crm_followup_events;
create policy "Role based CRM events select" on public.crm_followup_events for select to authenticated using (public.is_sales_admin() or exists(select 1 from public.crm_leads l where l.id = lead_id and (l.assigned_agent_id = auth.uid() or l.created_by_agent_id = auth.uid())));
create policy "Role based CRM events insert" on public.crm_followup_events for insert to authenticated with check (public.is_sales_admin() or actor_agent_id = auth.uid());

drop policy if exists "Authenticated admins manage CRM templates" on public.crm_followup_templates;
create policy "Authenticated read CRM templates" on public.crm_followup_templates for select to authenticated using (true);
create policy "Admins manage CRM templates" on public.crm_followup_templates for all to authenticated using (public.is_sales_admin()) with check (public.is_sales_admin());

commit;
