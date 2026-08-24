begin;

-- Concise public diagnostic derived from the longer consultancy discovery guide.
-- Only operational maturity questions score. Business size, pains and goals do not.
create temp table jewellery_v2_sections (
  section_key text,
  title text,
  description text,
  sort_order integer
) on commit drop;

insert into jewellery_v2_sections values
  ('contact', 'Start Your Jewellery Diagnostic', 'First, tell us who this report is for.', 1),
  ('business', 'Your Jewellery Business', 'A quick snapshot so the advice fits your business model.', 2),
  ('customer', 'How Customers Discover Products', 'Show us what happens from first interest to product selection.', 3),
  ('operations', 'How Selling Works Today', 'A practical look at enquiries, pricing, stock and orders.', 4),
  ('outcome', 'Pain, Impact and Growth', 'Identify what is costing the most and what should improve first.', 5);

create temp table jewellery_v2_questions (
  section_key text,
  question_key text,
  question_text text,
  question_type text,
  placeholder text,
  help_text text,
  is_required boolean,
  sort_order integer,
  weight numeric,
  validation_rules jsonb
) on commit drop;

insert into jewellery_v2_questions values
  ('contact', 'business_name', 'Business / Brand Name', 'text', 'Example: Meera Jewellers', null, true, 1, 0, '{}'::jsonb),
  ('contact', 'owner_name', 'Your Name', 'text', 'Example: Meera Jain', null, true, 2, 0, '{}'::jsonb),
  ('contact', 'phone', 'Mobile Number', 'phone', '10-digit mobile number', 'Use the number where our jewellery consultant can reach you.', true, 3, 0, '{"pattern":"^[6-9][0-9]{9}$"}'::jsonb),

  ('business', 'business_type', 'Which best describes your jewellery business?', 'single', null, null, true, 1, 0, '{}'::jsonb),
  ('business', 'years_in_business', 'How long have you been operating?', 'single', null, null, true, 2, 0, '{}'::jsonb),
  ('business', 'store_count', 'How many physical stores or showrooms do you operate?', 'single', null, null, true, 3, 0, '{}'::jsonb),
  ('business', 'customer_model', 'Who do you primarily sell to?', 'single', null, null, true, 4, 0, '{}'::jsonb),
  ('business', 'design_volume', 'Approximately how many active products or designs do you manage?', 'single', null, 'An approximate range is enough.', true, 5, 0, '{}'::jsonb),

  ('customer', 'online_presence', 'What best describes your current online presence?', 'single', null, null, true, 1, 1, '{}'::jsonb),
  ('customer', 'product_discovery', 'When customers want to see more designs, what usually happens?', 'single', null, null, true, 2, 1, '{}'::jsonb),
  ('customer', 'requirement_response', 'A customer asks for a specific category and budget. How quickly can your team share relevant options?', 'single', null, 'Example: Polki necklaces between Rs. 2 lakh and Rs. 5 lakh.', true, 3, 1, '{}'::jsonb),
  ('customer', 'catalogue_workflow', 'How do you usually share a collection with a customer?', 'single', null, null, true, 4, 1, '{}'::jsonb),

  ('operations', 'enquiry_management', 'How are enquiries recorded and followed up?', 'single', null, null, true, 1, 1, '{}'::jsonb),
  ('operations', 'pricing_process', 'What happens when metal rates or product prices change?', 'single', null, null, true, 2, 1, '{}'::jsonb),
  ('operations', 'estimation_process', 'How are customer estimates prepared?', 'single', null, null, true, 3, 1, '{}'::jsonb),
  ('operations', 'inventory_visibility', 'How reliably can your team confirm whether a design is available?', 'single', null, null, true, 4, 1, '{}'::jsonb),
  ('operations', 'order_process', 'How are orders, payments and delivery progress tracked?', 'single', null, null, true, 5, 1, '{}'::jsonb),

  ('outcome', 'pain_points', 'Which problems are costing you the most today?', 'multiple', null, 'Choose up to five. These guide the report but do not change your readiness score.', true, 1, 0, '{"max_selections":5}'::jsonb),
  ('outcome', 'scalability_breakpoint', 'If your enquiry volume doubled tomorrow, which process would struggle first?', 'textarea', 'Describe the first process or team that would be overloaded', null, true, 2, 0, '{}'::jsonb),
  ('outcome', 'growth_goal', 'What is your most important goal for the next 12 months?', 'single', null, null, true, 3, 0, '{}'::jsonb),
  ('outcome', 'desired_customer_action', 'What should an interested customer ideally be able to do?', 'single', null, null, true, 4, 0, '{}'::jsonb);

create temp table jewellery_v2_options (
  question_key text,
  option_value text,
  option_text text,
  score numeric,
  sort_order integer
) on commit drop;

insert into jewellery_v2_options values
  ('business_type','retailer','Retailer / showroom',0,1),
  ('business_type','wholesaler','Wholesaler / B2B supplier',0,2),
  ('business_type','manufacturer','Manufacturer',0,3),
  ('business_type','retailer_wholesaler','Retailer + wholesaler',0,4),
  ('business_type','manufacturer_wholesaler','Manufacturer + wholesaler',0,5),
  ('business_type','retailer_manufacturer','Retailer + manufacturer',0,6),
  ('business_type','designer','Designer / custom jewellery studio',0,7),
  ('business_type','other','Other jewellery business',0,8),
  ('years_in_business','under_2','Less than 2 years',0,1),
  ('years_in_business','2_5','2 - 5 years',0,2),
  ('years_in_business','6_10','6 - 10 years',0,3),
  ('years_in_business','11_20','11 - 20 years',0,4),
  ('years_in_business','above_20','More than 20 years',0,5),
  ('store_count','none','No physical store',0,1),
  ('store_count','one','1 store / showroom',0,2),
  ('store_count','2_3','2 - 3 stores',0,3),
  ('store_count','4_plus','4 or more stores',0,4),
  ('customer_model','b2c','Primarily consumers (B2C)',0,1),
  ('customer_model','b2b','Primarily retailers / dealers (B2B)',0,2),
  ('customer_model','both','Both B2C and B2B',0,3),
  ('design_volume','under_100','Fewer than 100',0,1),
  ('design_volume','100_500','100 - 500',0,2),
  ('design_volume','501_2000','501 - 2,000',0,3),
  ('design_volume','2001_5000','2,001 - 5,000',0,4),
  ('design_volume','above_5000','More than 5,000',0,5),

  ('online_presence','none','No active online presence',0,1),
  ('online_presence','social_only','Instagram, Facebook or WhatsApp only',1,2),
  ('online_presence','basic_website','Basic website used mainly for brand presence',2,3),
  ('online_presence','catalogue','Website or catalogue for browsing and enquiries',3,4),
  ('online_presence','commerce_manual','Online store, but stock, pricing or orders are still manual',4,5),
  ('online_presence','connected','Connected online selling with stock, payments and analytics',5,6),
  ('product_discovery','manual_search','A salesperson searches and sends photos manually',0,1),
  ('product_discovery','social_scroll','The customer scrolls social posts or asks repeatedly',1,2),
  ('product_discovery','fixed_pdf','We send an existing PDF or WhatsApp catalogue',2,3),
  ('product_discovery','organised_catalogue','The customer browses an organised digital catalogue',3,4),
  ('product_discovery','search_filters','The customer can search and filter relevant designs',4,5),
  ('product_discovery','personalised_measurable','We provide filtered selections and can measure engagement',5,6),
  ('requirement_response','over_day','Usually more than one working day',0,1),
  ('requirement_response','hours','A few hours, depending on salesperson availability',1,2),
  ('requirement_response','under_hour','Within an hour using manual search',2,3),
  ('requirement_response','under_15','Within 15 minutes using organised product data',3,4),
  ('requirement_response','instant_filter','Almost instantly using filters or saved collections',4,5),
  ('requirement_response','self_service','Customers can filter and browse suitable products themselves',5,6),
  ('catalogue_workflow','individual_images','Individual photos and prices are sent one by one',0,1),
  ('catalogue_workflow','manual_selection','A new selection is manually assembled each time',1,2),
  ('catalogue_workflow','fixed_catalogue','A fixed PDF or WhatsApp catalogue is shared',2,3),
  ('catalogue_workflow','digital_link','An organised digital catalogue link is shared',3,4),
  ('catalogue_workflow','filtered_link','A requirement-specific filtered link or catalogue is shared',4,5),
  ('catalogue_workflow','measured_journey','Customers self-browse and product interest is measurable',5,6),

  ('enquiry_management','memory_chat','Memory, personal phones or scattered chats',0,1),
  ('enquiry_management','notes','Notebook or informal list with inconsistent follow-up',1,2),
  ('enquiry_management','sheet','Shared spreadsheet or structured WhatsApp labels',2,3),
  ('enquiry_management','central_dashboard','Central enquiry dashboard with ownership',3,4),
  ('enquiry_management','scheduled_followup','Assigned leads with scheduled follow-ups and history',4,5),
  ('enquiry_management','measured_crm','Measured CRM process with conversion and source analytics',5,6),
  ('pricing_process','fully_manual','Prices are recalculated and shared manually',0,1),
  ('pricing_process','manual_periodic','Price lists are manually updated from time to time',1,2),
  ('pricing_process','software_disconnected','Software calculates prices, but catalogues remain separate',2,3),
  ('pricing_process','structured_updates','Product prices follow a structured update process',3,4),
  ('pricing_process','mostly_automated','Metal rates and product calculations are mostly automated',4,5),
  ('pricing_process','connected_accurate','Pricing, breakup and customer-facing data stay connected',5,6),
  ('estimation_process','handwritten','Handwritten or calculated manually',0,1),
  ('estimation_process','manual_template','Typed into a document or reusable template',1,2),
  ('estimation_process','billing_software','Generated in billing software without catalogue connection',2,3),
  ('estimation_process','digital_breakup','Digital estimate with a consistent price breakup',3,4),
  ('estimation_process','product_linked','Estimate is linked to current product and rate data',4,5),
  ('estimation_process','connected_history','Fast, connected estimates with customer history',5,6),
  ('inventory_visibility','uncertain','Availability depends on memory or physical checking',0,1),
  ('inventory_visibility','manual_register','Manually maintained register, tags or chats',1,2),
  ('inventory_visibility','software_delayed','Inventory software exists, but updates are delayed or separate',2,3),
  ('inventory_visibility','central_stock','Central stock is usually current',3,4),
  ('inventory_visibility','channel_synced','Stock is synchronised across major selling channels',4,5),
  ('inventory_visibility','real_time_multi_location','Real-time, multi-location inventory visibility',5,6),
  ('order_process','chat_notes','Orders and payments are tracked through chats or notes',0,1),
  ('order_process','manual_register','A manual register or spreadsheet is used',1,2),
  ('order_process','separate_systems','Billing, payment and delivery use separate systems',2,3),
  ('order_process','central_orders','Orders have central status and ownership',3,4),
  ('order_process','connected_fulfilment','Orders, payments and fulfilment are mostly connected',4,5),
  ('order_process','measured_automated','Connected workflow with customer updates and analytics',5,6),

  ('pain_points','manual_photos','Too much time is spent sending product photos and prices',0,1),
  ('pain_points','whatsapp_chaos','WhatsApp enquiries and follow-ups become difficult to track',0,2),
  ('pain_points','no_catalogue','Customers cannot browse an organised, searchable collection',0,3),
  ('pain_points','jewellery_price_updates','Metal-rate and product-price updates are too manual',0,4),
  ('pain_points','jewellery_stock','Design availability is difficult to confirm reliably',0,5),
  ('pain_points','jewellery_trust','Customers need better certification, breakup and product detail',0,6),
  ('pain_points','custom_order_tracking','Custom orders, karigar work or delivery dates are hard to track',0,7),
  ('pain_points','manual_orders','Orders, payments and delivery progress are fragmented',0,8),
  ('pain_points','low_repeat_orders','Past customers do not return often enough',0,9),
  ('pain_points','missed_enquiries','Slow responses or missed enquiries are costing sales',0,10),
  ('growth_goal','reduce_manual_work','Reduce repetitive manual work',0,1),
  ('growth_goal','increase_enquiries','Increase qualified enquiries',0,2),
  ('growth_goal','increase_orders','Increase online or assisted orders',0,3),
  ('growth_goal','improve_experience','Improve customer browsing and buying experience',0,4),
  ('growth_goal','expand_b2b','Expand B2B / wholesale sales',0,5),
  ('growth_goal','scale_locations','Scale geographically or add showrooms',0,6),
  ('desired_customer_action','browse','Browse relevant designs independently',0,1),
  ('desired_customer_action','enquire','Select products and send a qualified enquiry',0,2),
  ('desired_customer_action','appointment','Book a showroom or video appointment',0,3),
  ('desired_customer_action','order','Place an order online',0,4),
  ('desired_customer_action','b2b_order','Access a private catalogue and place a B2B order',0,5);

-- Preserve historical form rows but make this the only active Jewellery form.
update question_sections s
set is_active = false
from industries i
where s.industry_id = i.id and i.slug = 'jewellery';

update questions q
set is_active = false
from industries i
where q.industry_id = i.id and i.slug = 'jewellery';

insert into question_sections (industry_id, title, description, sort_order, is_active)
select i.id, s.title, s.description, s.sort_order, true
from jewellery_v2_sections s
join industries i on i.slug = 'jewellery'
where not exists (
  select 1 from question_sections existing
  where existing.industry_id = i.id and existing.title = s.title
);

update question_sections target
set description = source.description,
    sort_order = source.sort_order,
    is_active = true
from jewellery_v2_sections source
join industries i on i.slug = 'jewellery'
where target.industry_id = i.id and target.title = source.title;

insert into questions (
  industry_id, section_id, question_text, question_key, question_type,
  placeholder, help_text, is_required, sort_order, is_active, weight,
  is_conditional, ui_width, validation_rules
)
select i.id, s.id, q.question_text, q.question_key, q.question_type,
       q.placeholder, q.help_text, q.is_required, q.sort_order, true, q.weight,
       false, 'full', q.validation_rules
from jewellery_v2_questions q
join industries i on i.slug = 'jewellery'
join jewellery_v2_sections section_source on section_source.section_key = q.section_key
join question_sections s on s.industry_id = i.id and s.title = section_source.title
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
    validation_rules = source.validation_rules
from jewellery_v2_questions source
join industries i on i.slug = 'jewellery'
join jewellery_v2_sections section_source on section_source.section_key = source.section_key
join question_sections s on s.industry_id = i.id and s.title = section_source.title
where target.industry_id = i.id
  and target.section_id = s.id
  and target.question_key = source.question_key;

-- Deactivate stale options attached to the active form before restoring v2 options.
update question_options option_row
set is_active = false
from questions q, industries i
where option_row.question_id = q.id
  and q.industry_id = i.id
  and i.slug = 'jewellery'
  and q.is_active = true;

insert into question_options (
  question_id, option_text, option_value, score, sort_order, is_active, is_default
)
select q.id, o.option_text, o.option_value, o.score, o.sort_order, true, false
from jewellery_v2_options o
join industries i on i.slug = 'jewellery'
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
from jewellery_v2_options source
join industries i on i.slug = 'jewellery'
join questions q on q.industry_id = i.id and q.question_key = source.question_key and q.is_active = true
where target.question_id = q.id and target.option_value = source.option_value;

commit;
