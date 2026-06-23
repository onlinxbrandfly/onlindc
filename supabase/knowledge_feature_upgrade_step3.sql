-- OnlinDC Knowledge & Feature Mapping Upgrade - Step 3
-- Run this in Supabase SQL Editor.

alter table public.features_library
add column if not exists slug text,
add column if not exists global_feature boolean default false,
add column if not exists feature_link text,
add column if not exists video_url text,
add column if not exists icon_url text,
add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_features_library_slug
on public.features_library(slug)
where slug is not null;

create table if not exists public.feature_industry_mapping (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references public.features_library(id) on delete cascade,
  industry_id uuid references public.industries(id) on delete cascade,
  relevance_score int default 50,
  industry_use_case text,
  related_pain_points text[],
  related_business_types text[],
  priority int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.feature_use_cases (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references public.features_library(id) on delete cascade,
  industry_id uuid references public.industries(id) on delete cascade,
  title text not null,
  pain_point text,
  business_type text,
  use_case text,
  report_text text,
  video_url text,
  external_url text,
  priority int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.report_assets
add column if not exists feature_id uuid references public.features_library(id) on delete set null,
add column if not exists use_case_id uuid references public.feature_use_cases(id) on delete set null,
add column if not exists updated_at timestamptz default now();

alter table public.knowledge_items
add column if not exists feature_id uuid references public.features_library(id) on delete set null,
add column if not exists use_case_id uuid references public.feature_use_cases(id) on delete set null,
add column if not exists image_url text,
add column if not exists video_url text,
add column if not exists updated_at timestamptz default now();

create index if not exists idx_feature_mapping_feature on public.feature_industry_mapping(feature_id);
create index if not exists idx_feature_mapping_industry on public.feature_industry_mapping(industry_id);
create index if not exists idx_feature_use_cases_feature on public.feature_use_cases(feature_id);
create index if not exists idx_feature_use_cases_industry on public.feature_use_cases(industry_id);

alter table public.feature_industry_mapping disable row level security;
alter table public.feature_use_cases disable row level security;

insert into public.features_library (
  name, slug, global_feature, feature_category, short_description, feature_link, video_url, priority, is_active
)
values
('Product Catalogue Export', 'product-catalogue-export', true, 'Catalogue', 'Export products into shareable digital catalogues.', 'https://www.onlin.in/features', '', 100, true),
('PDF Catalogue Creation', 'pdf-catalogue-creation', true, 'Catalogue', 'Create branded PDF catalogues for sharing.', 'https://www.onlin.in/features', '', 95, true),
('WhatsApp Chat Integration', 'whatsapp-chat-integration', true, 'Communication', 'Connect product discovery with direct WhatsApp enquiries.', 'https://www.onlin.in/features', '', 90, true),
('Product Variants', 'product-variants', true, 'Products', 'Manage size, colour and product variations.', 'https://www.onlin.in/features', '', 85, true),
('Inventory Management', 'inventory-management', true, 'Operations', 'Track stock and product availability.', 'https://www.onlin.in/features', '', 80, true),
('In-Built SEO Tools', 'in-built-seo-tools', true, 'SEO', 'Improve discoverability through search-friendly pages.', 'https://www.onlin.in/features', '', 75, true),
('Flicks Shoppable Video', 'flicks-shoppable-video', true, 'Experience', 'Short-form shoppable video experience for product discovery.', 'https://www.onlin.in/features', '', 70, true)
on conflict (slug) do update set
  name = excluded.name,
  global_feature = true,
  feature_category = excluded.feature_category,
  short_description = excluded.short_description,
  feature_link = excluded.feature_link,
  priority = excluded.priority,
  is_active = true,
  updated_at = now();

insert into public.feature_use_cases (
  feature_id, industry_id, title, pain_point, business_type, use_case, report_text, external_url, video_url, priority, is_active
)
select f.id, i.id, x.title, x.pain_point, x.business_type, x.use_case, x.report_text, x.external_url, x.video_url, x.priority, true
from public.features_library f
join (
  values
  ('product-catalogue-export', 'Boutique Collection Sharing', 'No proper product catalogue', 'Boutique', 'Share new arrivals and seasonal collections through a structured digital catalogue.', 'Your business can reduce repeated manual photo sharing by using catalogue links where customers browse collections independently.', 'https://www.onlin.in/features', '', 100),
  ('product-catalogue-export', 'Wholesale Catalogue Sharing', 'No proper product catalogue', 'Wholesaler', 'Share category-wise catalogues with retailers and bulk buyers.', 'A digital catalogue helps wholesale buyers view collections faster and enquire with better product clarity.', 'https://www.onlin.in/features', '', 95),
  ('pdf-catalogue-creation', 'Festival PDF Catalogue', 'Customers ask for photos repeatedly', 'Boutique', 'Create branded PDFs for festive, clearance and wedding collections.', 'PDF catalogues make your brand look more professional while reducing repeated WhatsApp work.', 'https://www.onlin.in/features', '', 90),
  ('whatsapp-chat-integration', 'Product-to-WhatsApp Enquiry', 'WhatsApp inquiries become messy', 'Instagram Seller', 'Let customers enquire directly from specific product pages.', 'This converts vague WhatsApp messages into product-specific enquiries, making follow-up faster.', 'https://www.onlin.in/features', '', 88),
  ('product-variants', 'Size and Colour Selection', 'Difficult to manage size/color variants', 'Fashion Store', 'Show sizes, colours, patterns and fit options clearly on each product.', 'Clear variant selection reduces confusion and helps customers make faster decisions.', 'https://www.onlin.in/features', '', 85)
) as x(slug, title, pain_point, business_type, use_case, report_text, external_url, video_url, priority)
on f.slug = x.slug
join public.industries i on i.slug = 'fashion'
where not exists (
  select 1 from public.feature_use_cases uc
  where uc.feature_id = f.id and uc.industry_id = i.id and uc.title = x.title
);
