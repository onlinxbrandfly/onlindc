begin;

-- Launch only replaces active form content. Historical questions and answers remain intact.
create temp table launch_sections (
  industry_slug text,
  section_key text,
  title text,
  description text,
  sort_order integer
) on commit drop;

insert into launch_sections values
  ('fashion', 'business', 'Your Fashion Business', 'A quick snapshot of what you sell and how you operate.', 1),
  ('fashion', 'selling', 'Customer Journey', 'Tell us where customers buy and how they browse your products.', 2),
  ('fashion', 'operations', 'Your Selling System', 'A quick look at operations, follow-up and digital readiness.', 3),
  ('fashion', 'growth', 'Your Growth Gaps', 'Choose the challenges and priorities that matter most right now.', 4),
  ('fashion', 'contact', 'Create Your Report', 'Add your details to personalise the diagnostic report.', 5),
  ('jewellery', 'business', 'Your Jewellery Business', 'A quick snapshot of your jewellery model and product mix.', 1),
  ('jewellery', 'selling', 'Customer Journey', 'Tell us where customers buy and how they browse your jewellery.', 2),
  ('jewellery', 'operations', 'Your Selling System', 'A quick look at operations, follow-up and digital readiness.', 3),
  ('jewellery', 'growth', 'Your Growth Gaps', 'Choose the challenges and priorities that matter most right now.', 4),
  ('jewellery', 'contact', 'Create Your Report', 'Add your details to personalise the diagnostic report.', 5);

create temp table launch_questions (
  industry_slug text,
  section_key text,
  question_key text,
  question_text text,
  question_type text,
  placeholder text,
  help_text text,
  is_required boolean,
  sort_order integer,
  weight numeric
) on commit drop;

insert into launch_questions values
  ('fashion', 'business', 'business_type', 'Which best describes your fashion business?', 'single', null, null, true, 1, 0),
  ('fashion', 'business', 'product_categories', 'What do you mainly sell?', 'multiple', null, 'Select all that apply.', true, 2, 0),
  ('fashion', 'selling', 'selling_channels', 'Where can customers currently buy from you?', 'multiple', null, 'Select every active sales channel.', true, 1, 1),
  ('fashion', 'selling', 'product_discovery', 'How do customers usually browse your products?', 'single', null, null, true, 2, 1),
  ('fashion', 'operations', 'operations_system', 'How are stock and orders managed today?', 'single', null, null, true, 1, 1),
  ('fashion', 'operations', 'customer_followup', 'How do you bring past customers back?', 'single', null, null, true, 2, 1),
  ('fashion', 'operations', 'digital_maturity', 'How complete is your digital selling setup?', 'single', null, null, true, 3, 1),
  ('fashion', 'growth', 'pain_points', 'What slows your growth today?', 'multiple', null, 'Choose up to five that feel most relevant.', true, 1, 0),
  ('fashion', 'growth', 'growth_goal', 'What is your main goal for the next six months?', 'single', null, null, true, 2, 0),
  ('fashion', 'growth', 'investment_readiness', 'What level of monthly investment feels realistic?', 'single', null, null, true, 3, 0),
  ('fashion', 'contact', 'business_name', 'Business / Brand Name', 'text', 'Example: Meera Fashion Studio', null, true, 1, 0),
  ('fashion', 'contact', 'owner_name', 'Your Name', 'text', 'Example: Meera Jain', null, true, 2, 0),
  ('fashion', 'contact', 'phone', 'Phone Number', 'phone', 'Example: 9876543210', null, true, 3, 0),

  ('jewellery', 'business', 'business_type', 'Which best describes your jewellery business?', 'single', null, null, true, 1, 0),
  ('jewellery', 'business', 'product_categories', 'What do you mainly sell?', 'multiple', null, 'Select all that apply.', true, 2, 0),
  ('jewellery', 'selling', 'selling_channels', 'Where can customers currently buy from you?', 'multiple', null, 'Select every active sales channel.', true, 1, 1),
  ('jewellery', 'selling', 'product_discovery', 'How do customers usually browse your jewellery?', 'single', null, null, true, 2, 1),
  ('jewellery', 'operations', 'operations_system', 'How are stock, pricing and orders managed today?', 'single', null, null, true, 1, 1),
  ('jewellery', 'operations', 'customer_followup', 'How do you bring past customers back?', 'single', null, null, true, 2, 1),
  ('jewellery', 'operations', 'digital_maturity', 'How complete is your digital selling setup?', 'single', null, null, true, 3, 1),
  ('jewellery', 'growth', 'pain_points', 'What slows your growth today?', 'multiple', null, 'Choose up to five that feel most relevant.', true, 1, 0),
  ('jewellery', 'growth', 'growth_goal', 'What is your main goal for the next six months?', 'single', null, null, true, 2, 0),
  ('jewellery', 'growth', 'investment_readiness', 'What level of monthly investment feels realistic?', 'single', null, null, true, 3, 0),
  ('jewellery', 'contact', 'business_name', 'Business / Brand Name', 'text', 'Example: Meera Jewellers', null, true, 1, 0),
  ('jewellery', 'contact', 'owner_name', 'Your Name', 'text', 'Example: Meera Jain', null, true, 2, 0),
  ('jewellery', 'contact', 'phone', 'Phone Number', 'phone', 'Example: 9876543210', null, true, 3, 0);

create temp table launch_options (
  industry_slug text,
  question_key text,
  option_value text,
  option_text text,
  score numeric,
  sort_order integer
) on commit drop;

insert into launch_options values
  ('fashion','business_type','own_brand','Own fashion brand',0,1),
  ('fashion','business_type','single_store','Single-brand store',0,2),
  ('fashion','business_type','multi_brand','Multi-brand retailer',0,3),
  ('fashion','business_type','boutique','Boutique / designer studio',0,4),
  ('fashion','business_type','manufacturer_wholesaler','Manufacturer / wholesaler',0,5),
  ('fashion','business_type','home_reseller','Home seller / reseller',0,6),
  ('fashion','product_categories','womens_wear','Women''s wear',0,1),
  ('fashion','product_categories','mens_wear','Men''s wear',0,2),
  ('fashion','product_categories','kids_wear','Kids wear',0,3),
  ('fashion','product_categories','ethnic_designer','Ethnic / sarees / designer wear',0,4),
  ('fashion','product_categories','western_wear','Western wear',0,5),
  ('fashion','product_categories','accessories','Fashion accessories',0,6),
  ('fashion','selling_channels','home_store','Home / physical store only',1,1),
  ('fashion','selling_channels','whatsapp','WhatsApp orders',1,2),
  ('fashion','selling_channels','social','Instagram / social commerce',2,3),
  ('fashion','selling_channels','exhibitions','Exhibitions / pop-ups',2,4),
  ('fashion','selling_channels','marketplace','Online marketplace',3,5),
  ('fashion','selling_channels','own_store','Own website / online store',5,6),
  ('fashion','product_discovery','manual_photos','Photos sent one by one',1,1),
  ('fashion','product_discovery','social_feed','Instagram posts and reels',2,2),
  ('fashion','product_discovery','pdf_catalogue','PDF / WhatsApp catalogue',3,3),
  ('fashion','product_discovery','digital_catalogue','Searchable digital catalogue',4,4),
  ('fashion','product_discovery','online_store','Online store with filters and variants',5,5),
  ('fashion','operations_system','memory_notes','Memory, notebooks or chat messages',1,1),
  ('fashion','operations_system','spreadsheets','Spreadsheets with manual follow-up',2,2),
  ('fashion','operations_system','separate_tools','Separate billing, stock and order tools',3,3),
  ('fashion','operations_system','partly_connected','Partly connected digital workflow',4,4),
  ('fashion','operations_system','integrated','Integrated stock and order system',5,5),
  ('fashion','customer_followup','none','No regular follow-up',1,1),
  ('fashion','customer_followup','manual_messages','Occasional manual messages',2,2),
  ('fashion','customer_followup','broadcasts','WhatsApp broadcasts / social updates',3,3),
  ('fashion','customer_followup','planned_campaigns','Planned launches and customer campaigns',4,4),
  ('fashion','customer_followup','automated_retention','Automated segments, reminders and offers',5,5),
  ('fashion','digital_maturity','social_only','Only WhatsApp / social pages',1,1),
  ('fashion','digital_maturity','basic_presence','Google profile or basic website',2,2),
  ('fashion','digital_maturity','catalogue_no_checkout','Digital catalogue without structured checkout',3,3),
  ('fashion','digital_maturity','store_manual_ops','Online store with manual operations',4,4),
  ('fashion','digital_maturity','connected_commerce','Connected store, inventory, payments and analytics',5,5),
  ('fashion','pain_points','manual_photos','Customers repeatedly ask for product photos',0,1),
  ('fashion','pain_points','whatsapp_chaos','WhatsApp enquiries become difficult to track',0,2),
  ('fashion','pain_points','no_catalogue','No organised, searchable product catalogue',0,3),
  ('fashion','pain_points','size_variant_confusion','Size, colour and variant confusion',0,4),
  ('fashion','pain_points','stock_confusion','Stock availability is unclear across channels',0,5),
  ('fashion','pain_points','manual_orders','Orders, payments and dispatch are tracked manually',0,6),
  ('fashion','pain_points','weak_brand_trust','The brand does not look professional online',0,7),
  ('fashion','pain_points','low_google_visibility','Customers cannot discover us on Google',0,8),
  ('fashion','pain_points','low_repeat_orders','Past customers do not return often enough',0,9),
  ('fashion','pain_points','delivery_confusion','Delivery charges and timelines create confusion',0,10),
  ('fashion','growth_goal','professional_brand','Build a stronger professional brand',0,1),
  ('fashion','growth_goal','more_orders','Increase enquiries and online orders',0,2),
  ('fashion','growth_goal','launch_store','Launch or improve our online store',0,3),
  ('fashion','growth_goal','scale_operations','Scale wholesale, branches or operations',0,4),
  ('fashion','investment_readiness','exploring','Still exploring the right investment',0,1),
  ('fashion','investment_readiness','under_10000','Under Rs. 10,000 per month',0,2),
  ('fashion','investment_readiness','10000_25000','Rs. 10,000 - Rs. 25,000 per month',0,3),
  ('fashion','investment_readiness','25000_50000','Rs. 25,000 - Rs. 50,000 per month',0,4),
  ('fashion','investment_readiness','above_50000','Above Rs. 50,000 per month',0,5),

  ('jewellery','business_type','retailer','Jewellery retailer / showroom',0,1),
  ('jewellery','business_type','own_brand','Own jewellery brand',0,2),
  ('jewellery','business_type','manufacturer','Manufacturer',0,3),
  ('jewellery','business_type','wholesaler','Wholesaler / B2B supplier',0,4),
  ('jewellery','business_type','designer','Designer / custom jewellery studio',0,5),
  ('jewellery','business_type','home_seller','Home seller / reseller',0,6),
  ('jewellery','product_categories','gold','Gold jewellery',0,1),
  ('jewellery','product_categories','diamond','Diamond jewellery',0,2),
  ('jewellery','product_categories','silver','Silver jewellery',0,3),
  ('jewellery','product_categories','fashion','Fashion / imitation jewellery',0,4),
  ('jewellery','product_categories','bridal','Bridal collections',0,5),
  ('jewellery','product_categories','custom','Custom-made jewellery',0,6),
  ('jewellery','selling_channels','showroom_home','Showroom / home appointments only',1,1),
  ('jewellery','selling_channels','whatsapp','WhatsApp enquiries and orders',1,2),
  ('jewellery','selling_channels','social','Instagram / social commerce',2,3),
  ('jewellery','selling_channels','exhibitions','Exhibitions / appointments',2,4),
  ('jewellery','selling_channels','marketplace','Online marketplace',3,5),
  ('jewellery','selling_channels','own_store','Own website / online store',5,6),
  ('jewellery','product_discovery','manual_photos','Photos and prices sent one by one',1,1),
  ('jewellery','product_discovery','social_feed','Instagram posts and reels',2,2),
  ('jewellery','product_discovery','pdf_catalogue','PDF / WhatsApp catalogue',3,3),
  ('jewellery','product_discovery','digital_catalogue','Digital catalogue with product details',4,4),
  ('jewellery','product_discovery','online_store','Online store with filters, trust and enquiries',5,5),
  ('jewellery','operations_system','memory_notes','Memory, tags, notebooks or chat messages',1,1),
  ('jewellery','operations_system','spreadsheets','Spreadsheets with manual price updates',2,2),
  ('jewellery','operations_system','separate_tools','Separate billing, stock and order tools',3,3),
  ('jewellery','operations_system','partly_connected','Partly connected jewellery workflow',4,4),
  ('jewellery','operations_system','integrated','Integrated stock, pricing and order system',5,5),
  ('jewellery','customer_followup','none','No regular follow-up',1,1),
  ('jewellery','customer_followup','manual_messages','Occasional manual messages',2,2),
  ('jewellery','customer_followup','broadcasts','WhatsApp broadcasts / social updates',3,3),
  ('jewellery','customer_followup','planned_campaigns','Planned festive and customer campaigns',4,4),
  ('jewellery','customer_followup','automated_retention','Automated segments, reminders and schemes',5,5),
  ('jewellery','digital_maturity','social_only','Only WhatsApp / social pages',1,1),
  ('jewellery','digital_maturity','basic_presence','Google profile or basic website',2,2),
  ('jewellery','digital_maturity','catalogue_no_checkout','Digital catalogue without structured enquiries',3,3),
  ('jewellery','digital_maturity','store_manual_ops','Online store with manual stock and pricing',4,4),
  ('jewellery','digital_maturity','connected_commerce','Connected catalogue, stock, orders and analytics',5,5),
  ('jewellery','pain_points','manual_photos','Customers repeatedly ask for jewellery photos and prices',0,1),
  ('jewellery','pain_points','whatsapp_chaos','WhatsApp enquiries become difficult to track',0,2),
  ('jewellery','pain_points','no_catalogue','No organised digital jewellery catalogue',0,3),
  ('jewellery','pain_points','jewellery_price_updates','Metal-rate and product-price updates are manual',0,4),
  ('jewellery','pain_points','jewellery_stock','Unique-piece stock availability is difficult to track',0,5),
  ('jewellery','pain_points','jewellery_trust','Customers need more trust, certification and product detail',0,6),
  ('jewellery','pain_points','custom_order_tracking','Custom orders and karigar work are hard to track',0,7),
  ('jewellery','pain_points','manual_orders','Orders, payments and delivery are tracked manually',0,8),
  ('jewellery','pain_points','low_repeat_orders','Past customers do not return often enough',0,9),
  ('jewellery','pain_points','secure_delivery','High-value delivery and tracking create concern',0,10),
  ('jewellery','growth_goal','professional_brand','Build a stronger trusted jewellery brand',0,1),
  ('jewellery','growth_goal','more_enquiries','Increase qualified enquiries and orders',0,2),
  ('jewellery','growth_goal','launch_catalogue','Launch a digital catalogue or online store',0,3),
  ('jewellery','growth_goal','scale_operations','Scale showrooms, wholesale or operations',0,4),
  ('jewellery','investment_readiness','exploring','Still exploring the right investment',0,1),
  ('jewellery','investment_readiness','under_10000','Under Rs. 10,000 per month',0,2),
  ('jewellery','investment_readiness','10000_25000','Rs. 10,000 - Rs. 25,000 per month',0,3),
  ('jewellery','investment_readiness','25000_50000','Rs. 25,000 - Rs. 50,000 per month',0,4),
  ('jewellery','investment_readiness','above_50000','Above Rs. 50,000 per month',0,5);

-- Deactivate the former launch forms while preserving all historical rows.
update question_sections s
set is_active = false
from industries i
where s.industry_id = i.id and i.slug in ('fashion', 'jewellery');

update questions q
set is_active = false
from industries i
where q.industry_id = i.id and i.slug in ('fashion', 'jewellery');

insert into question_sections (industry_id, title, description, sort_order, is_active)
select i.id, s.title, s.description, s.sort_order, true
from launch_sections s
join industries i on i.slug = s.industry_slug
where not exists (
  select 1 from question_sections existing
  where existing.industry_id = i.id and existing.title = s.title
);

update question_sections target
set description = source.description,
    sort_order = source.sort_order,
    is_active = true
from launch_sections source
join industries i on i.slug = source.industry_slug
where target.industry_id = i.id and target.title = source.title;

insert into questions (
  industry_id, section_id, question_text, question_key, question_type,
  placeholder, help_text, is_required, sort_order, is_active, weight,
  is_conditional, ui_width, validation_rules
)
select i.id, s.id, q.question_text, q.question_key, q.question_type,
       q.placeholder, q.help_text, q.is_required, q.sort_order, true, q.weight,
       false, 'full', '{}'::jsonb
from launch_questions q
join industries i on i.slug = q.industry_slug
join launch_sections ls on ls.industry_slug = q.industry_slug and ls.section_key = q.section_key
join question_sections s on s.industry_id = i.id and s.title = ls.title
where not exists (
  select 1 from questions existing
  where existing.industry_id = i.id
    and existing.section_id = s.id
    and existing.question_key = q.question_key
);

update questions target
set question_text = source.question_text,
    question_type = source.question_type,
    placeholder = source.placeholder,
    help_text = source.help_text,
    is_required = source.is_required,
    sort_order = source.sort_order,
    is_active = true,
    weight = source.weight,
    is_conditional = false,
    ui_width = 'full',
    validation_rules = '{}'::jsonb
from launch_questions source
join industries i on i.slug = source.industry_slug
join launch_sections ls on ls.industry_slug = source.industry_slug and ls.section_key = source.section_key
join question_sections s on s.industry_id = i.id and s.title = ls.title
where target.industry_id = i.id
  and target.section_id = s.id
  and target.question_key = source.question_key;

update questions q
set validation_rules = '{"max_selections": 5}'::jsonb
from industries i
where q.industry_id = i.id
  and i.slug in ('fashion', 'jewellery')
  and q.question_key = 'pain_points'
  and q.is_active = true;

insert into question_options (
  question_id, option_text, option_value, score, sort_order, is_active, is_default
)
select q.id, o.option_text, o.option_value, o.score, o.sort_order, true, false
from launch_options o
join industries i on i.slug = o.industry_slug
join questions q on q.industry_id = i.id and q.question_key = o.question_key and q.is_active = true
where not exists (
  select 1 from question_options existing
  where existing.question_id = q.id and existing.option_value = o.option_value
);

update question_options target
set option_text = source.option_text,
    score = source.score,
    sort_order = source.sort_order,
    is_active = true
from launch_options source
join industries i on i.slug = source.industry_slug
join questions q on q.industry_id = i.id and q.question_key = source.question_key and q.is_active = true
where target.question_id = q.id and target.option_value = source.option_value;

-- Canonical pain vocabulary drives reality checks, feature recommendations and roadmaps.
insert into pain_points_master (code, title, description, category, keywords, is_active, priority)
values
  ('manual_photos','Manual product sharing','Sending product photos and details repeatedly slows response time and creates inconsistent customer conversations.','Product Discovery',array['customers repeatedly ask for product photos','customers repeatedly ask for jewellery photos and prices','photos and prices sent one by one'],true,95),
  ('whatsapp_chaos','Unstructured WhatsApp enquiries','Important enquiries, product context and follow-ups are easily lost inside chat conversations.','Sales Operations',array['whatsapp enquiries become difficult to track'],true,94),
  ('no_catalogue','No organised digital catalogue','Customers cannot browse a structured, searchable and always-current product collection.','Product Discovery',array['no organised searchable product catalogue','no organised digital jewellery catalogue'],true,93),
  ('stock_confusion','Stock availability confusion','Unclear stock across channels creates repeated checks, missed sales and overselling risk.','Inventory',array['stock availability is unclear across channels'],true,92),
  ('size_variant_confusion','Size and variant confusion','Customers need clear size, colour and variant choices before they can decide confidently.','Product Management',array['size colour and variant confusion'],true,91),
  ('manual_orders','Manual order processing','Manual tracking makes payment, fulfilment and order status difficult to control as sales grow.','Orders',array['orders payments and dispatch are tracked manually','orders payments and delivery are tracked manually'],true,90),
  ('weak_brand_trust','Weak online brand trust','An incomplete digital presence makes new customers hesitate before enquiring or buying.','Brand Trust',array['brand does not look professional online'],true,89),
  ('low_google_visibility','Low Google visibility','The business depends on existing contacts and social platforms instead of searchable discovery.','Discovery',array['customers cannot discover us on google'],true,86),
  ('low_repeat_orders','Low repeat customer engagement','Customer relationships are not being converted into structured repeat business.','Retention',array['past customers do not return often enough'],true,87),
  ('delivery_confusion','Delivery charge confusion','Unclear delivery charges and timelines create friction before purchase.','Delivery',array['delivery charges and timelines create confusion'],true,82),
  ('jewellery_price_updates','Manual jewellery price updates','Changing metal rates and product prices are difficult to keep current across catalogues and conversations.','Jewellery Operations',array['metal rate and product price updates are manual'],true,96),
  ('jewellery_stock','Unique-piece stock confusion','Unique jewellery pieces require precise stock visibility to avoid showing unavailable items.','Jewellery Inventory',array['unique piece stock availability is difficult to track'],true,95),
  ('jewellery_trust','Jewellery trust and certification gap','Customers need complete material, weight, certification and trust information before making a high-value purchase.','Jewellery Trust',array['customers need more trust certification and product detail'],true,97),
  ('custom_order_tracking','Custom order and karigar tracking','Custom designs and karigar work need visible milestones, ownership and delivery commitments.','Jewellery Operations',array['custom orders and karigar work are hard to track'],true,94),
  ('secure_delivery','High-value delivery concern','High-value orders need secure payment, dispatch and tracking communication.','Jewellery Delivery',array['high value delivery and tracking create concern'],true,91)
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  keywords = excluded.keywords,
  is_active = excluded.is_active,
  priority = excluded.priority,
  updated_at = now();

create temp table launch_mappings (
  industry_slug text,
  pain_code text,
  pain_point text,
  feature_name text,
  priority integer,
  recommendation_text text,
  use_case_text text
) on commit drop;

insert into launch_mappings values
  ('fashion','manual_photos','Manual product sharing','Product Catalogue',96,'Give customers one organised place to browse collections instead of requesting photos repeatedly.','Publish collection-wise products with current details and images.'),
  ('fashion','whatsapp_chaos','Unstructured WhatsApp enquiries','WhatsApp Integration',94,'Keep WhatsApp useful while carrying product context into a structured selling flow.','Connect customer conversations with clear products and actions.'),
  ('fashion','no_catalogue','No organised digital catalogue','Product Catalogue',95,'Create a searchable catalogue organised by collection, category and price.','Let customers browse without waiting for manual replies.'),
  ('fashion','stock_confusion','Stock availability confusion','Inventory Management',94,'Maintain current stock visibility across the team and customer channels.','Reduce repeated availability checks and overselling.'),
  ('fashion','size_variant_confusion','Size and variant confusion','Product Variants',93,'Present sizes, colours and variants clearly on every product.','Help customers choose correctly before ordering.'),
  ('fashion','manual_orders','Manual order processing','Checkout Form',92,'Standardise enquiry, checkout and order information.','Capture complete order details without chat-based confusion.'),
  ('fashion','weak_brand_trust','Weak online brand trust','Custom E-Store',91,'Give the fashion brand a professional destination it controls.','Build trust with branded product discovery and proof.'),
  ('fashion','low_google_visibility','Low Google visibility','Integrated SEO',88,'Create searchable category and product pages.','Build discovery beyond Instagram and existing contacts.'),
  ('fashion','low_repeat_orders','Low repeat customer engagement','Notifications',87,'Bring buyers back with launches, reminders and targeted updates.','Run a consistent retention rhythm around collections.'),
  ('fashion','delivery_confusion','Delivery charge confusion','Delivery Charges',84,'Show delivery charges and rules before purchase.','Reduce last-minute delivery friction.'),

  ('jewellery','manual_photos','Manual product sharing','Product Catalogue',96,'Create a polished jewellery catalogue with complete product details.','Stop repeating photos and price information in every conversation.'),
  ('jewellery','whatsapp_chaos','Unstructured WhatsApp enquiries','WhatsApp Integration',94,'Keep product context attached to jewellery enquiries.','Move from scattered chats to structured customer actions.'),
  ('jewellery','no_catalogue','No organised digital catalogue','Jewellery Module',98,'Build jewellery-specific product discovery with the details customers expect.','Present collections, material, pricing and trust information clearly.'),
  ('jewellery','jewellery_price_updates','Manual jewellery price updates','Price Change',99,'Update product pricing efficiently when rates change.','Keep prices current without editing products one by one.'),
  ('jewellery','jewellery_stock','Unique-piece stock confusion','Inventory Management',97,'Track unique-piece availability accurately across enquiries and sales.','Avoid presenting sold or unavailable jewellery.'),
  ('jewellery','jewellery_trust','Jewellery trust and certification gap','Jewellery Module',100,'Present material, weight, certification and product details consistently.','Build confidence for high-consideration jewellery purchases.'),
  ('jewellery','jewellery_trust','Jewellery trust and certification gap','Custom E-Store',93,'Give customers a trusted branded destination for jewellery discovery.','Combine product proof, brand story and enquiry actions.'),
  ('jewellery','custom_order_tracking','Custom order and karigar tracking','Karigar',99,'Track custom jewellery work and production responsibility visibly.','Create a reliable workflow from design request to delivery.'),
  ('jewellery','manual_orders','Manual order processing','Checkout Form',91,'Capture complete order and customer details in a structured flow.','Reduce errors across payment, fulfilment and delivery.'),
  ('jewellery','low_repeat_orders','Low repeat customer engagement','Schemes',92,'Create structured reasons for jewellery customers to return.','Run schemes and relationship-led repeat engagement.'),
  ('jewellery','secure_delivery','High-value delivery concern','Live Tracking',94,'Give customers clear high-value dispatch and delivery visibility.','Share reliable tracking from dispatch to receipt.');

update pain_point_feature_mapping m
set is_active = false,
    updated_at = now()
from industries i
where m.industry_id = i.id and i.slug in ('fashion', 'jewellery');

insert into pain_point_feature_mapping (
  industry_id, pain_point, feature_id, priority, recommendation_text,
  pain_code, use_case_text, business_type, stage_slug, relevance_score,
  is_active, updated_at
)
select i.id, m.pain_point, f.id, m.priority, m.recommendation_text,
       m.pain_code, m.use_case_text, i.name, null, m.priority,
       true, now()
from launch_mappings m
join industries i on i.slug = m.industry_slug
join features_library f on f.name = m.feature_name and f.is_active = true
where not exists (
  select 1 from pain_point_feature_mapping existing
  where existing.industry_id = i.id
    and existing.pain_code = m.pain_code
    and existing.feature_id = f.id
);

update pain_point_feature_mapping target
set pain_point = source.pain_point,
    priority = source.priority,
    recommendation_text = source.recommendation_text,
    use_case_text = source.use_case_text,
    business_type = i.name,
    stage_slug = null,
    relevance_score = source.priority,
    is_active = true,
    updated_at = now()
from launch_mappings source
join industries i on i.slug = source.industry_slug
join features_library f on f.name = source.feature_name and f.is_active = true
where target.industry_id = i.id
  and target.pain_code = source.pain_code
  and target.feature_id = f.id;

create temp table launch_roadmaps (
  industry_slug text,
  pain_code text,
  phase text,
  task_title text,
  task_description text,
  expected_outcome text,
  sort_order integer,
  priority integer
) on commit drop;

insert into launch_roadmaps values
  ('fashion','manual_photos','First 30 Days','Create a collection photo system','Organise approved product images, names, prices and availability by collection.','The team can answer enquiries quickly without searching for content.',10,96),
  ('fashion','whatsapp_chaos','First 30 Days','Standardise enquiry handling','Define quick replies and required product, size, payment and delivery details.','Sales conversations become faster and easier to continue.',20,95),
  ('fashion','no_catalogue','First 30 Days','Build collection-wise catalogues','Group products into clear customer-facing collections with current details.','Customers browse independently before contacting the team.',30,94),
  ('fashion','size_variant_confusion','First 30 Days','Document size and variant rules','Prepare size charts, colour choices, fit notes and variant naming standards.','Customers choose more confidently with fewer repetitive questions.',40,93),
  ('fashion','stock_confusion','Next 60 Days','Create one stock source of truth','Move stock updates into one shared system used by every selling channel.','Availability checks and overselling reduce significantly.',50,92),
  ('fashion','manual_orders','Next 60 Days','Define the order status workflow','Track enquiry, confirmation, payment, packing, dispatch and completion consistently.','Every team member can see what each order needs next.',60,91),
  ('fashion','weak_brand_trust','Next 60 Days','Create a professional browsing destination','Publish brand story, collections, policies, testimonials and clear enquiry actions.','New customers gain confidence before starting a conversation.',70,90),
  ('fashion','low_google_visibility','Next 90 Days','Publish searchable category content','Write useful category names, product titles and descriptions around customer searches.','Qualified discovery grows beyond social media.',80,88),
  ('fashion','low_repeat_orders','Next 90 Days','Launch a retention calendar','Plan new-arrival, festive, replenishment and customer-return campaigns.','Past buyers hear from the brand with useful, well-spaced updates.',90,87),
  ('fashion','delivery_confusion','Next 60 Days','Publish delivery rules','Define charges, service areas, dispatch timing and return expectations.','Customers know the delivery commitment before ordering.',100,84),

  ('jewellery','manual_photos','First 30 Days','Create a jewellery content standard','Organise approved photos, videos, weights, materials, prices and availability.','Every enquiry receives consistent and complete product information.',10,97),
  ('jewellery','whatsapp_chaos','First 30 Days','Structure jewellery enquiries','Capture product reference, budget, occasion, timeline and follow-up status.','High-intent conversations are easier to prioritise and continue.',20,96),
  ('jewellery','no_catalogue','First 30 Days','Build collection-wise jewellery catalogues','Organise jewellery by material, occasion, price range and collection.','Customers discover suitable pieces without requesting every photo.',30,95),
  ('jewellery','jewellery_trust','First 30 Days','Create a product trust checklist','Standardise material, purity, weight, certification, care and policy information.','Customers receive the proof needed for confident consideration.',40,99),
  ('jewellery','jewellery_price_updates','Next 60 Days','Define the live pricing workflow','Document how rate changes update products, catalogues and customer quotes.','Price information remains current across the business.',50,98),
  ('jewellery','jewellery_stock','Next 60 Days','Create unique-piece inventory control','Assign product codes and maintain one availability status across channels.','Sold and reserved pieces are not offered accidentally.',60,97),
  ('jewellery','custom_order_tracking','Next 60 Days','Create custom-order milestones','Track design approval, material, karigar assignment, production, quality check and delivery.','Custom orders progress predictably with clear accountability.',70,96),
  ('jewellery','manual_orders','Next 60 Days','Standardise order and payment records','Capture customer, product, payment, invoice and fulfilment details in one workflow.','Order errors and status confusion reduce as volume grows.',80,92),
  ('jewellery','low_repeat_orders','Next 90 Days','Build a relationship calendar','Plan occasion reminders, schemes, new collections and service follow-ups.','Customer relationships turn into timely repeat opportunities.',90,91),
  ('jewellery','secure_delivery','Next 90 Days','Define secure fulfilment communication','Standardise payment verification, packaging, insurance, dispatch and tracking updates.','Customers feel informed and protected through delivery.',100,90);

update roadmap_templates r
set is_active = false,
    updated_at = now()
from industries i
where r.industry_id = i.id and i.slug in ('fashion', 'jewellery');

insert into roadmap_templates (
  industry_id, stage_slug, pain_code, phase, task_title, task_description,
  expected_outcome, sort_order, priority, is_active, updated_at
)
select i.id, null, r.pain_code, r.phase, r.task_title, r.task_description,
       r.expected_outcome, r.sort_order, r.priority, true, now()
from launch_roadmaps r
join industries i on i.slug = r.industry_slug
where not exists (
  select 1 from roadmap_templates existing
  where existing.industry_id = i.id
    and existing.pain_code = r.pain_code
    and existing.task_title = r.task_title
);

update roadmap_templates target
set stage_slug = null,
    phase = source.phase,
    task_description = source.task_description,
    expected_outcome = source.expected_outcome,
    sort_order = source.sort_order,
    priority = source.priority,
    is_active = true,
    updated_at = now()
from launch_roadmaps source
join industries i on i.slug = source.industry_slug
where target.industry_id = i.id
  and target.pain_code = source.pain_code
  and target.task_title = source.task_title;

commit;
