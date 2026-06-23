-- OnlinDC Feature Media Manager v1
-- Run this in Supabase SQL Editor.

create table if not exists public.feature_media (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references public.features_library(id) on delete cascade,
  media_type text default 'image',
  media_url text not null,
  caption text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_feature_media_feature on public.feature_media(feature_id);
alter table public.feature_media disable row level security;

-- Create public storage bucket for feature media
insert into storage.buckets (id, name, public)
values ('feature-media', 'feature-media', true)
on conflict (id) do update set public = true;

-- Storage policies for MVP testing
drop policy if exists "feature media public read" on storage.objects;
drop policy if exists "feature media anon upload" on storage.objects;
drop policy if exists "feature media anon update" on storage.objects;
drop policy if exists "feature media anon delete" on storage.objects;

create policy "feature media public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'feature-media');

create policy "feature media anon upload"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'feature-media');

create policy "feature media anon update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'feature-media')
with check (bucket_id = 'feature-media');

create policy "feature media anon delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'feature-media');
