-- OnlinDC PWA notifications

begin;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  device_name text,
  user_agent text,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  important_leads boolean default true,
  daily_summary boolean default true,
  demo_updates boolean default true,
  won_updates boolean default true,
  quiet_start time default '21:00',
  quiet_end time default '08:00',
  timezone text default 'Asia/Kolkata',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  url text default '/admin',
  metadata jsonb default '{}'::jsonb,
  is_read boolean default false,
  pushed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read) where is_read = false;

alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions" on public.push_subscriptions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own notification preferences" on public.notification_preferences;
create policy "Users manage own notification preferences" on public.notification_preferences
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.notification_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.notify_all_admins(
  event_type text,
  event_title text,
  event_body text,
  event_url text default '/admin',
  event_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, notification_type, title, body, url, metadata)
  select id, event_type, event_title, event_body, event_url, event_metadata
  from auth.users;
$$;

create or replace function public.on_submission_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_all_admins(
    'new_diagnostic',
    'New diagnostic received',
    'A new business diagnostic is ready for review.',
    '/admin',
    jsonb_build_object('submission_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists submissions_notification_trigger on public.submissions;
create trigger submissions_notification_trigger
after insert on public.submissions
for each row execute function public.on_submission_notification();

create or replace function public.on_crm_lead_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and coalesce(new.source, 'Manual') <> 'Diagnostic' and new.priority_label = 'High Priority' then
    perform public.notify_all_admins('important_lead', 'Important new lead', 'A high-priority lead needs your attention.', '/admin');
  elsif tg_op = 'UPDATE' and coalesce(old.stage, old.status) is distinct from coalesce(new.stage, new.status) then
    if coalesce(new.stage, new.status) = 'Demo Scheduled' then
      perform public.notify_all_admins('demo_scheduled', 'Demo scheduled', 'A lead has moved to Demo Scheduled.', '/admin');
    elsif coalesce(new.stage, new.status) = 'Won' then
      perform public.notify_all_admins('lead_won', 'Opportunity won', 'A CRM opportunity has been marked as won.', '/admin');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists crm_lead_notification_trigger on public.crm_leads;
create trigger crm_lead_notification_trigger
after insert or update of stage, status, priority_label on public.crm_leads
for each row execute function public.on_crm_lead_notification();

create or replace function public.create_daily_followup_summary()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  due_count integer;
begin
  select count(*) into due_count
  from (
    select distinct on (lead_id) lead_id, due_at
    from public.crm_followup_tasks
    where status = 'Pending'
    order by lead_id, due_at
  ) next_tasks
  where due_at < ((date_trunc('day', now() at time zone 'Asia/Kolkata') + interval '1 day') at time zone 'Asia/Kolkata');

  if due_count > 0 then
    insert into public.notifications (user_id, notification_type, title, body, url, metadata)
    select p.user_id, 'daily_summary', 'Today''s follow-ups',
      due_count || ' lead' || case when due_count = 1 then '' else 's' end || ' need follow-up today.',
      '/admin', jsonb_build_object('due_count', due_count)
    from public.notification_preferences p
    where p.daily_summary = true;
  end if;
end;
$$;

create extension if not exists pg_cron;
do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'onlindc-daily-followup-summary' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
  perform cron.schedule('onlindc-daily-followup-summary', '30 3 * * *', 'select public.create_daily_followup_summary();');
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

commit;
