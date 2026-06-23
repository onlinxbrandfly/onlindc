-- OnlinDC UI Fixes + Demo Store Support
-- Run this in Supabase SQL Editor if these columns are missing.

alter table public.report_assets
add column if not exists logo_url text,
add column if not exists image_url text,
add column if not exists updated_at timestamptz default now();

alter table public.report_assets disable row level security;
