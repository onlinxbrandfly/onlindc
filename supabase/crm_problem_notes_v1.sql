-- Store lead-specific problem context separately from general internal notes.

begin;

alter table public.crm_leads
  add column if not exists problem_notes text;

commit;
