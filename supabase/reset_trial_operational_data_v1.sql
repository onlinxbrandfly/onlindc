-- Reset trial operational data while preserving configuration, content and users.
begin;

-- Optional report tracking tables are not present in every environment.
do $$
begin
  if to_regclass('public.report_view_events') is not null then
    execute 'delete from public.report_view_events';
  end if;
  if to_regclass('public.generated_reports') is not null then
    execute 'delete from public.generated_reports';
  end if;
end $$;

-- These rows are operational history. CRM child rows and assignment history
-- cascade when their parent leads are removed.
delete from public.crm_followup_events;
delete from public.crm_followup_tasks;
delete from public.lead_assignments;
delete from public.crm_leads;
delete from public.submission_answers;
delete from public.submissions;

-- Clear business-event notifications but preserve device subscriptions,
-- user preferences and system configuration.
delete from public.notifications
where notification_type in (
  'new_diagnostic', 'important_lead', 'demo_scheduled',
  'lead_won', 'daily_summary', 'test'
);

commit;
