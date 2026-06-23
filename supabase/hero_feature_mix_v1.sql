-- OnlinDC Hero Feature Mix v1
-- Run this in Supabase SQL Editor.

create table if not exists public.industry_hero_features (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid references public.industries(id) on delete cascade,
  feature_id uuid references public.features_library(id) on delete cascade,
  stage_slug text,
  hero_score int default 50,
  hero_reason text,
  use_case_text text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_industry_hero_features_lookup
on public.industry_hero_features(industry_id, stage_slug, feature_id);

alter table public.industry_hero_features disable row level security;

insert into public.industry_hero_features
(industry_id, feature_id, stage_slug, hero_score, hero_reason, use_case_text, is_active)
select i.id, f.id, x.stage_slug, x.hero_score, x.hero_reason, x.use_case_text, true
from public.industries i
join (
  values
  ('custom-e-store', 'manual', 95, 'Foundation feature for fashion businesses moving from WhatsApp/Instagram to a professional store.', 'Use this as the main branded destination where customers can browse collections and enquire confidently.'),
  ('product-catalogue-export', 'manual', 94, 'High-impact feature for fashion sellers because product discovery often starts with catalogue sharing.', 'Create collection-wise catalogues for new arrivals, festive drops and price brackets.'),
  ('whatsapp-chat-integration', 'manual', 92, 'Fashion enquiries usually happen on WhatsApp, so connecting products to conversations improves closing speed.', 'Let customers enquire directly from product pages instead of sending vague screenshots.'),
  ('inventory-management', 'manual', 88, 'Stock clarity is critical when the same collection is sold through store, Instagram and WhatsApp.', 'Track product availability and reduce repeated manual confirmation.'),
  ('product-variants', 'manual', 86, 'Fashion products need sizes, colours, patterns and fit options clearly visible.', 'Make variant selection easy for customers and staff.'),
  ('flicks-shoppable-video', 'manual', 82, 'Fashion sells visually, so video-led discovery can increase interest and engagement.', 'Use shoppable videos for new arrivals, looks, styling and festive drops.'),
  ('pdf-catalogue-creation', 'manual', 81, 'PDF catalogue works well for repeat customers and broadcast sharing.', 'Share branded PDFs for seasonal collections and price ranges.'),

  ('product-catalogue-export', 'under_structured', 95, 'A polished catalogue system helps under-structured fashion brands look more premium.', 'Use catalogues for wholesale buyers, regular customers and seasonal launches.'),
  ('in-built-seo-tools', 'under_structured', 92, 'SEO can help fashion stores get discovered beyond Instagram.', 'Create searchable product and category pages for long-term discovery.'),
  ('notifications', 'under_structured', 88, 'Repeat customer engagement matters after the brand has a basic digital system.', 'Promote new arrivals, festive collections and clearance offers.'),
  ('flicks-shoppable-video', 'under_structured', 86, 'Video-led selling gives fashion businesses a richer discovery experience.', 'Show lookbooks, styling reels and product highlights inside the buying journey.'),
  ('sales-dashboard', 'under_structured', 84, 'Business owners need visibility on sales performance.', 'Track what is selling, what is slow and where growth is coming from.'),
  ('advanced-seo', 'under_structured', 82, 'Advanced SEO is valuable for brands ready to scale search visibility.', 'Improve product discovery through structured SEO and category content.')
) as x(feature_slug, stage_slug, hero_score, hero_reason, use_case_text)
on true
join public.features_library f on f.slug = x.feature_slug
where i.slug = 'fashion'
and not exists (
  select 1 from public.industry_hero_features h
  where h.industry_id = i.id and h.feature_id = f.id and h.stage_slug = x.stage_slug
);

select 'industry_hero_features' as table_name, count(*) as total
from public.industry_hero_features;
