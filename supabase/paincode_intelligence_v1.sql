-- OnlinDC Pain Code Intelligence v1
-- This fixes generic feature recommendations by using pain codes instead of text matching.
-- Run this in Supabase SQL Editor.

-- 1) Pain Points Master
create table if not exists public.pain_points_master (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  category text,
  keywords text[],
  is_active boolean default true,
  priority int default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pain_points_master disable row level security;

-- 2) Upgrade pain_point_feature_mapping
alter table public.pain_point_feature_mapping
add column if not exists pain_code text,
add column if not exists use_case_text text,
add column if not exists business_type text,
add column if not exists stage_slug text,
add column if not exists relevance_score int default 50,
add column if not exists is_active boolean default true,
add column if not exists updated_at timestamptz default now();

create index if not exists idx_ppfm_industry_code on public.pain_point_feature_mapping(industry_id, pain_code);
create index if not exists idx_ppfm_feature on public.pain_point_feature_mapping(feature_id);

alter table public.pain_point_feature_mapping disable row level security;

-- 3) Roadmap Templates
create table if not exists public.roadmap_templates (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid references public.industries(id) on delete cascade,
  stage_slug text,
  pain_code text,
  phase text not null,
  task_title text not null,
  task_description text,
  expected_outcome text,
  sort_order int default 0,
  priority int default 50,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_roadmap_templates_lookup on public.roadmap_templates(industry_id, stage_slug, pain_code);
alter table public.roadmap_templates disable row level security;

-- 4) Seed Pain Codes
insert into public.pain_points_master (code, title, description, category, keywords, priority, is_active)
values
('manual_photos', 'Customers ask for photos repeatedly', 'Customers repeatedly ask for product photos, catalogues or collections on WhatsApp.', 'Catalogue', array['photo','photos','catalogue','catalog','manual sharing','ask for photos','product photos','whatsapp photos'], 100, true),
('whatsapp_chaos', 'WhatsApp enquiries become messy', 'Product enquiries are mixed with general chats, making follow-up difficult.', 'Enquiry Management', array['whatsapp','messy','enquiry','inquiries','follow up','follow-up','messages','screenshots'], 95, true),
('no_catalogue', 'No proper product catalogue', 'Products are not arranged in a professional, shareable catalogue.', 'Catalogue', array['catalogue','catalog','collection','pdf','product list','lookbook'], 92, true),
('stock_confusion', 'Stock availability confusion', 'Stock is not clear to customers or staff, causing repeated confirmation.', 'Inventory', array['stock','inventory','availability','out of stock','overselling'], 90, true),
('size_variant_confusion', 'Difficult to manage size/color variants', 'Size, colour, fit or pattern options are not easy to show and select.', 'Variants', array['size','colour','color','variant','fit','pattern','sku'], 88, true),
('low_google_visibility', 'No Google visibility', 'Business depends only on Instagram/WhatsApp and is not discoverable on Google.', 'Visibility', array['google','seo','visibility','search','discover','instagram only'], 82, true),
('weak_brand_trust', 'No professional online identity', 'Brand looks informal or trust is low because there is no structured digital presence.', 'Branding', array['trust','branding','professional','website','identity','store'], 80, true),
('low_repeat_orders', 'Low repeat customer engagement', 'Existing customers are not being reactivated through campaigns, offers or collections.', 'Retention', array['repeat','retention','customer database','notification','offers','campaign'], 78, true),
('manual_orders', 'Manual order processing', 'Orders are manually tracked, verified or followed up without a structured system.', 'Orders', array['manual order','orders','checkout','payment','invoice'], 76, true),
('delivery_confusion', 'Delivery charge confusion', 'Customers are unclear about delivery charges or delivery process.', 'Delivery', array['delivery','shipping','charges','courier'], 72, true)
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  keywords = excluded.keywords,
  priority = excluded.priority,
  is_active = true,
  updated_at = now();

-- 5) Seed Fashion Pain Code -> Feature Mapping
-- This does not delete your features. It maps pain codes to the best matching existing feature slugs.
with fashion as (
  select id from public.industries where slug = 'fashion' limit 1
),
feature_match as (
  select slug, id from public.features_library
)
insert into public.pain_point_feature_mapping (
  industry_id, pain_code, pain_point, feature_id, priority, relevance_score,
  recommendation_text, use_case_text, business_type, stage_slug, is_active
)
select fashion.id, x.pain_code, x.pain_point, f.id, x.priority, x.relevance_score,
       x.recommendation_text, x.use_case_text, x.business_type, x.stage_slug, true
from fashion
join (
  values
  ('manual_photos', 'Customers ask for photos repeatedly', 'product-catalogue-export', 100, 100, 'Reduce repeated photo sharing by giving customers a structured product catalogue they can browse independently.', 'Use catalogue links instead of sending product photos again and again on WhatsApp.', 'Fashion / Clothing', 'manual'),
  ('manual_photos', 'Customers ask for photos repeatedly', 'pdf-catalogue-creation', 96, 95, 'Create branded PDF catalogues for new arrivals, festive launches and repeat buyers.', 'Use PDF catalogues for collections, price brackets and customer segments.', 'Fashion / Clothing', 'manual'),
  ('no_catalogue', 'No proper product catalogue', 'product-catalogue-export', 98, 98, 'Create category-wise and collection-wise catalogues so customers can discover products without manual follow-up.', 'Use catalogues for sarees, kurtis, menswear, kidswear, price brackets or festive drops.', 'Fashion / Clothing', 'manual'),
  ('whatsapp_chaos', 'WhatsApp enquiries become messy', 'whatsapp-chat-integration', 95, 96, 'Convert vague WhatsApp enquiries into product-specific conversations with better buying context.', 'Let customers enquire from product pages instead of sending unclear screenshots.', 'Fashion / Clothing', 'manual'),
  ('stock_confusion', 'Stock availability confusion', 'inventory-management', 92, 94, 'Track product availability and reduce repeated stock confirmation between staff and customers.', 'Use inventory visibility to avoid overselling and customer disappointment.', 'Fashion / Clothing', 'manual'),
  ('size_variant_confusion', 'Difficult to manage size/color variants', 'product-variants', 90, 92, 'Make size, colour and pattern selection clear so customers can decide faster.', 'Use variants and size charts for apparel options.', 'Fashion / Clothing', 'manual'),
  ('low_google_visibility', 'No Google visibility', 'in-built-seo-tools', 84, 86, 'Build discoverability beyond Instagram with search-friendly product and category pages.', 'Create SEO-friendly category pages for fashion collections.', 'Fashion / Clothing', 'under_structured'),
  ('weak_brand_trust', 'No professional online identity', 'branding-themes', 82, 84, 'Improve trust by giving the brand a professional storefront experience.', 'Use branding, theme and store design to improve customer confidence.', 'Fashion / Clothing', 'manual'),
  ('low_repeat_orders', 'Low repeat customer engagement', 'notifications', 80, 82, 'Bring customers back with launch updates, offer alerts and collection reminders.', 'Use notifications to promote new arrivals and seasonal offers.', 'Fashion / Clothing', 'under_structured'),
  ('manual_orders', 'Manual order processing', 'checkout-form', 78, 80, 'Move from manual order collection to a structured checkout and enquiry flow.', 'Use checkout and order flow to reduce manual tracking.', 'Fashion / Clothing', 'manual'),
  ('delivery_confusion', 'Delivery charge confusion', 'delivery-charges', 72, 75, 'Give customers clarity on delivery charges before purchase.', 'Use delivery charge rules for city, state or order value.', 'Fashion / Clothing', 'under_structured'),
  ('weak_brand_trust', 'No professional online identity', 'custom-e-store', 88, 90, 'Create a branded online store where customers can browse products professionally.', 'Use a custom e-store as the central destination for product discovery.', 'Fashion / Clothing', 'manual')
) as x(pain_code, pain_point, feature_slug, priority, relevance_score, recommendation_text, use_case_text, business_type, stage_slug)
on f.slug = x.feature_slug
where not exists (
  select 1 from public.pain_point_feature_mapping m
  where m.industry_id = fashion.id
    and m.pain_code = x.pain_code
    and m.feature_id = f.id
);

-- 6) Seed Fashion Roadmap Templates
with fashion as (
  select id from public.industries where slug = 'fashion' limit 1
)
insert into public.roadmap_templates (
  industry_id, stage_slug, pain_code, phase, task_title, task_description, expected_outcome, sort_order, priority, is_active
)
select fashion.id, x.stage_slug, x.pain_code, x.phase, x.task_title, x.task_description, x.expected_outcome, x.sort_order, x.priority, true
from fashion
join (
  values
  ('manual', 'manual_photos', 'First 30 Days', 'Create a product photo system', 'Organize product photos category-wise with clear names, prices and availability notes.', 'Your team can respond faster and avoid searching photos manually.', 10, 100),
  ('manual', 'no_catalogue', 'First 30 Days', 'Create collection-wise catalogues', 'Group products into clear catalogues such as new arrivals, festive wear, sarees, kurtis, menswear or price brackets.', 'Customers can browse faster without asking for every photo.', 20, 98),
  ('manual', 'whatsapp_chaos', 'First 30 Days', 'Standardize WhatsApp enquiry replies', 'Create quick reply formats for price, size, availability, delivery and payment questions.', 'Follow-ups become faster and more professional.', 30, 96),
  ('manual', 'size_variant_confusion', 'First 30 Days', 'Prepare size and variant rules', 'Document size charts, colour options, fit information and common variant combinations.', 'Customers get better clarity before enquiring or ordering.', 40, 90),
  ('manual', 'stock_confusion', 'Next 60 Days', 'Digitize stock tracking', 'Move inventory from manual memory or notebooks into a structured digital stock system.', 'Avoid overselling and reduce repeated availability checks.', 50, 92),
  ('manual', 'manual_orders', 'Next 60 Days', 'Create an order tracking workflow', 'Define how enquiry, confirmation, payment, packing and dispatch will be tracked.', 'Your team knows the exact status of every order.', 60, 85),
  ('manual', 'weak_brand_trust', 'Next 60 Days', 'Build a professional product browsing page', 'Create a branded digital destination where customers can browse product categories.', 'Brand trust improves and customers take the business more seriously.', 70, 88),
  ('manual', 'low_google_visibility', 'Next 90 Days', 'Create Google-searchable category pages', 'Start building category pages with product titles, descriptions and searchable content.', 'Customers can discover the business beyond Instagram and WhatsApp.', 80, 80),
  ('manual', 'low_repeat_orders', 'Next 90 Days', 'Launch repeat customer campaigns', 'Create customer lists and send collection drops, offers and new arrival updates.', 'Existing customers return more often.', 90, 82),

  ('under_structured', 'manual_photos', 'First 30 Days', 'Upgrade catalogue presentation', 'Improve existing product sharing into polished collection-wise catalogues.', 'Product discovery becomes more premium and organized.', 10, 95),
  ('under_structured', 'whatsapp_chaos', 'First 30 Days', 'Connect product discovery with enquiries', 'Ensure every enquiry has product context such as item name, price, size and image.', 'Sales conversations become cleaner and easier to close.', 20, 94),
  ('under_structured', 'stock_confusion', 'Next 60 Days', 'Sync inventory with selling channels', 'Keep stock status updated across store, WhatsApp and staff workflow.', 'Stock confusion reduces across customer and team interactions.', 30, 92),
  ('under_structured', 'low_google_visibility', 'Next 60 Days', 'Improve SEO and product content', 'Write better product titles, category names and descriptions for search visibility.', 'Organic discovery improves over time.', 40, 90),
  ('under_structured', 'low_repeat_orders', 'Next 90 Days', 'Create launch and retention calendar', 'Plan monthly collection launches, festive campaigns and repeat buyer offers.', 'Repeat orders and customer recall improve.', 50, 88),
  ('under_structured', 'weak_brand_trust', 'Next 90 Days', 'Create proof and trust layer', 'Add testimonials, customer photos, reviews and brand story to the digital store.', 'New customers feel more confident buying online.', 60, 84)
) as x(stage_slug, pain_code, phase, task_title, task_description, expected_outcome, sort_order, priority)
where not exists (
  select 1 from public.roadmap_templates r
  where r.industry_id = fashion.id
    and r.stage_slug = x.stage_slug
    and r.pain_code = x.pain_code
    and r.task_title = x.task_title
);
