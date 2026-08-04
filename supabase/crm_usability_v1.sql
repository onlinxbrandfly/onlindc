-- OnlinDC CRM usability cleanup
-- Reclassifies legacy priorities and rebases untouched generated sequences.

begin;

update public.crm_leads
set
  priority_label = case
    when coalesce(priority_score, 0) >= 85 then 'High Priority'
    when coalesce(priority_score, 0) >= 55 then 'Good Opportunity'
    else 'Nurture'
  end,
  updated_at = now();

with untouched_leads as (
  select l.id
  from public.crm_leads l
  where not exists (
    select 1
    from public.crm_followup_tasks completed
    where completed.lead_id = l.id
      and completed.status = 'Completed'
  )
), generated_steps as (
  select t.id,
    row_number() over (
      partition by t.lead_id
      order by t.sequence_day, t.created_at, t.id
    ) - 1 as step_index
  from public.crm_followup_tasks t
  join untouched_leads l on l.id = t.lead_id
  where t.status = 'Pending'
    and t.title in (
      'Report delivery', 'First contact', 'Problem-specific help',
      'Similar business example', 'Relevant business example',
      'Feature education', 'Useful solution', 'Soft demo invite',
      'Nurture check-in'
    )
)
update public.crm_followup_tasks t
set
  due_at = now() +
    case g.step_index
      when 0 then interval '1 hour'
      when 1 then interval '2 days'
      when 2 then interval '5 days'
      when 3 then interval '9 days'
      when 4 then interval '15 days'
      else interval '30 days'
    end,
  updated_at = now()
from generated_steps g
where t.id = g.id;

with next_tasks as (
  select distinct on (lead_id) lead_id, title, due_at
  from public.crm_followup_tasks
  where status = 'Pending'
  order by lead_id, due_at, created_at
)
update public.crm_leads l
set
  next_action = n.title,
  next_followup_at = n.due_at,
  updated_at = now()
from next_tasks n
where l.id = n.lead_id
  and coalesce(l.stage, l.status, 'New') not in ('Won', 'Lost');

commit;
