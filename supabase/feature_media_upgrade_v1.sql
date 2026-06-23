-- OnlinDC Feature Experience Modal v1
-- Run this in Supabase SQL Editor before using feature image sliders.

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

-- Sample placeholders. Replace URLs from Admin/Supabase later.
insert into public.feature_media (feature_id, media_type, media_url, caption, sort_order, is_active)
select f.id, 'image', x.media_url, x.caption, x.sort_order, true
from public.features_library f
join (
  values
  ('product-catalogue-export', 'https://placehold.co/1200x800/195FA6/FFFFFF?text=Product+Catalogue', 'Digital catalogue view', 1),
  ('product-catalogue-export', 'https://placehold.co/1200x800/FFFFFF/195FA6?text=Collection+Sharing', 'Share collections with customers', 2),
  ('pdf-catalogue-creation', 'https://placehold.co/1200x800/195FA6/FFFFFF?text=PDF+Catalogue', 'PDF catalogue preview', 1),
  ('whatsapp-chat-integration', 'https://placehold.co/1200x800/195FA6/FFFFFF?text=WhatsApp+Enquiry', 'Product to WhatsApp enquiry flow', 1),
  ('product-variants', 'https://placehold.co/1200x800/195FA6/FFFFFF?text=Variants+%26+Sizes', 'Size and colour variants', 1),
  ('inventory-management', 'https://placehold.co/1200x800/195FA6/FFFFFF?text=Inventory+Management', 'Stock availability control', 1),
  ('in-built-seo-tools', 'https://placehold.co/1200x800/195FA6/FFFFFF?text=SEO+Tools', 'SEO friendly product pages', 1)
) as x(slug, media_url, caption, sort_order)
on f.slug = x.slug
where not exists (
  select 1 from public.feature_media fm
  where fm.feature_id = f.id and fm.media_url = x.media_url
);
