-- OnlinDC Admin Mapping + Star Feature + Category Management v1

alter table public.features_library
add column if not exists is_star_feature boolean default false,
add column if not exists star_score int default 0;

create table if not exists public.feature_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.feature_categories disable row level security;
alter table public.features_library disable row level security;
alter table public.pain_points_master disable row level security;
alter table public.pain_point_feature_mapping disable row level security;
alter table public.industry_hero_features disable row level security;

insert into public.feature_categories (name, description, sort_order, is_active)
select distinct feature_category, 'Feature category', 0, true
from public.features_library
where feature_category is not null and trim(feature_category) <> ''
on conflict (name) do nothing;

-- Mark initial fashion star features if present
update public.features_library
set is_star_feature = true,
    star_score = case
      when slug in ('product-catalogue-export','custom-e-store','whatsapp-chat-integration') then 100
      when slug in ('inventory-management','product-variants','flicks-shoppable-video') then 85
      when slug in ('in-built-seo-tools','notifications','sales-dashboard') then 75
      else coalesce(star_score, 0)
    end
where slug in (
  'product-catalogue-export',
  'custom-e-store',
  'whatsapp-chat-integration',
  'inventory-management',
  'product-variants',
  'flicks-shoppable-video',
  'in-built-seo-tools',
  'notifications',
  'sales-dashboard'
);

select 'features_starred' as table_name, count(*) as total
from public.features_library
where is_star_feature = true;
