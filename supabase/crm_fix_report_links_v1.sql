-- Replace development and legacy report origins in prepared CRM messages.

update public.crm_followup_tasks
set
  message = replace(
    replace(message, 'http://localhost:3000', 'https://onlindc.onlinxbrandfly.workers.dev'),
    'https://onlindc.pages.dev', 'https://onlindc.onlinxbrandfly.workers.dev'
  ),
  updated_at = now()
where message like '%localhost:3000%'
   or message like '%onlindc.pages.dev%';
