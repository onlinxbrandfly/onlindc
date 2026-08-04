# OnlinDC Database Schema

This document is derived from:

- Supabase queries in `src/`
- SQL patch files in `supabase/`

The repository does not include one complete base schema migration. Some base tables are therefore documented from application usage and marked as inferred.

## Overview

OnlinDC uses Supabase Database and Supabase Storage directly from the React app.

Main schema areas:

- Diagnostic form setup
- Submissions and answers
- Report content
- Feature library and feature media
- Pain-code intelligence
- Roadmap templates
- Admin support tables

## Relationship Summary

```text
industries
  |-- question_sections
  |    |-- questions
  |         |-- question_options
  |
  |-- submissions
  |    |-- submission_answers
  |
  |-- report_assets
  |-- knowledge_items
  |-- feature_use_cases
  |-- feature_industry_mapping
  |-- pain_point_feature_mapping
  |-- roadmap_templates
  |-- industry_hero_features

features_library
  |-- feature_media
  |-- feature_use_cases
  |-- feature_industry_mapping
  |-- pain_point_feature_mapping
  |-- industry_hero_features
  |-- report_assets
  |-- knowledge_items

pain_points_master
  |-- pain_point_feature_mapping by pain_code
  |-- roadmap_templates by pain_code
```

## Tables Used By The App

### `industries`

Purpose: Business categories/industries for diagnostics and reports.

Status: Base table inferred from app usage. No complete `create table` statement is present in the repo.

Used by:

- Public industry selector
- Form Builder
- Admin submissions
- Reports
- Content filtering

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `name` | text | Industry display name |
| `slug` | text | URL/content slug |
| `description` | text | Inserted by admin when creating industry |
| `sort_order` | int | Used for ordering |
| `is_active` | boolean | Public form only loads active industries |
| `created_at` | timestamptz | Used implicitly for Supabase rows, inferred |
| `updated_at` | timestamptz | Inferred |

Relationships:

- Referenced by many tables through `industry_id`.

App operations:

- Select active industries ordered by `sort_order`.
- Insert new industries from admin.
- Select related `industries(name)` and `industries(id,name,slug)`.

### `question_sections`

Purpose: Groups diagnostic questions into steps/sections per industry.

Status: Base table inferred from app usage.

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `industry_id` | uuid | References `industries(id)` |
| `title` | text | Section title |
| `description` | text | Section intro/help text |
| `sort_order` | int | Used for ordering |
| `is_active` | boolean | Public diagnostic only loads active sections |
| `created_at` | timestamptz | Inferred |
| `updated_at` | timestamptz | Updated by admin section save |

Relationships:

- `industry_id -> industries.id`
- Referenced by `questions.section_id`

App operations:

- Select active sections by industry.
- Insert section from Form Builder.
- Update title/description.
- Duplicate sections between industries.

Known gap:

- App does not implement section delete yet.

### `questions`

Purpose: Diagnostic questions for an industry and section.

Status: Base table inferred from app usage.

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `industry_id` | uuid | References `industries(id)` |
| `section_id` | uuid | References `question_sections(id)` |
| `question_text` | text | Prompt shown to user |
| `question_key` | text | Semantic key, e.g. `business_name`, `phone`, `pain_points` |
| `question_type` | text | `text`, `email`, `phone`, `number`, `textarea`, `single`, `multiple`, `select` |
| `placeholder` | text | Input placeholder |
| `help_text` | text | Help text shown in public form |
| `weight` | numeric/int | Used in scoring |
| `is_required` | boolean | Used by public validation |
| `is_active` | boolean | Public diagnostic only loads active questions |
| `sort_order` | int | Used for ordering |
| `created_at` | timestamptz | Inferred |
| `updated_at` | timestamptz | Inferred |

Relationships:

- `industry_id -> industries.id`
- `section_id -> question_sections.id`
- Referenced by `question_options.question_id`
- Referenced by `submission_answers.question_id`

App operations:

- Select active questions by industry.
- Insert/update/delete questions.
- Toggle active state.
- Duplicate questions and options.

Known issue:

- `QuestionEditor` edits `help_text` and `weight`, but current save payload does not persist all displayed fields consistently.

### `question_options`

Purpose: Answer options and scoring for choice questions.

Status: Base table inferred from app usage.

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `question_id` | uuid | References `questions(id)` |
| `option_text` | text | Display label |
| `option_value` | text | Stored/generated value |
| `score` | numeric/int | Used in diagnostic score |
| `score_label` | text | Edited in UI, persistence may be incomplete |
| `help_text` | text | Edited in UI, persistence may be incomplete |
| `is_active` | boolean | Public diagnostic only loads active options |
| `sort_order` | int | Used for ordering |
| `created_at` | timestamptz | Inferred |
| `updated_at` | timestamptz | Inferred |

Relationships:

- `question_id -> questions.id`

App operations:

- Select options for loaded questions.
- Insert/update/delete options.
- Duplicate options with duplicated questions/forms.

### `submissions`

Purpose: One completed diagnostic submission and generated report metadata.

Status: Base table inferred from app usage.

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `industry_id` | uuid | References `industries(id)` |
| `business_name` | text | From diagnostic answer key `business_name` |
| `owner_name` | text | From diagnostic answer key `owner_name` |
| `phone` | text | From diagnostic answer key `phone` |
| `email` | text | From diagnostic answer key `email` |
| `total_score` | numeric/int | Raw weighted score |
| `score_percentage` | numeric/int | Readiness percentage |
| `readiness_stage` | text | Derived from score |
| `report_summary` | text | Generated summary copy |
| `report_slug` | text | Public report slug |
| `report_url` | text | Public report URL |
| `report_generated_at` | timestamptz | Generated timestamp |
| `created_at` | timestamptz | Used by admin submissions list |
| `updated_at` | timestamptz | Inferred |

Relationships:

- `industry_id -> industries.id`
- Referenced by `submission_answers.submission_id`

App operations:

- Insert on public diagnostic submit.
- Select by `report_slug`.
- Fallback select by `id`.
- Admin list ordered by `created_at`.

### `submission_answers`

Purpose: Stores submitted answers per question.

Status: Base table inferred from app usage.

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `submission_id` | uuid | References `submissions(id)` |
| `question_id` | uuid | References `questions(id)` |
| `answer_text` | text | Free-text answer |
| `selected_option_texts` | text[] or jsonb | App writes array of option labels |
| `score` | numeric/int | Score for this answer |
| `created_at` | timestamptz | Used by admin answer ordering |
| `updated_at` | timestamptz | Inferred |

Relationships:

- `submission_id -> submissions.id`
- `question_id -> questions.id`

App operations:

- Insert answer rows after submission insert.
- Select with related `questions(question_text, question_key)`.

## Feature And Content Tables

### `features_library`

Purpose: Master list of Onlin features.

Status: Base table exists outside repo; patch files add columns.

Columns confirmed by migrations:

| Column | Type | Notes |
| --- | --- | --- |
| `slug` | text | Added by `knowledge_feature_upgrade_step3.sql`; unique partial index |
| `global_feature` | boolean | Default false |
| `feature_link` | text | External feature URL |
| `video_url` | text | Feature video URL |
| `icon_url` | text | Feature icon URL |
| `updated_at` | timestamptz | Default now |
| `is_star_feature` | boolean | Added by admin restore/smooth admin scripts |
| `star_score` | int | Added by admin restore/smooth admin scripts |

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `name` | text | Feature name |
| `feature_category` | text | Category/group |
| `short_description` | text | Report/admin description |
| `priority` | int | Sorting/recommendation priority |
| `is_active` | boolean | Report only loads active features |
| `created_at` | timestamptz | Inferred |

Indexes:

```sql
create unique index if not exists idx_features_library_slug
on public.features_library(slug)
where slug is not null;
```

Relationships:

- Referenced by `feature_media.feature_id`
- Referenced by `feature_use_cases.feature_id`
- Referenced by `feature_industry_mapping.feature_id`
- Referenced by `pain_point_feature_mapping.feature_id`
- Referenced by `industry_hero_features.feature_id`
- Referenced by `report_assets.feature_id`
- Referenced by `knowledge_items.feature_id`

App operations:

- Select active features for reports.
- Admin insert/update.
- Toggle star feature.

### `feature_media`

Purpose: Images/videos attached to a feature, used in the report feature modal.

Status: Created by migration.

Definition:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `feature_id` | uuid | References `features_library(id)` on delete cascade |
| `media_type` | text | Default `image`; app uses `image` or `video` |
| `media_url` | text | Required |
| `caption` | text | Optional |
| `sort_order` | int | Default 0 |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

Indexes:

```sql
create index if not exists idx_feature_media_feature
on public.feature_media(feature_id);
```

App operations:

- Select ordered by `sort_order`.
- Insert uploaded media records.
- Insert video URL records.
- Update caption, sort order, active flag.
- Delete media records.

### `feature_industry_mapping`

Purpose: Maps features to industries.

Status: Created by migrations, but currently not used by report logic.

Definition from `knowledge_feature_upgrade_step3.sql`:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `feature_id` | uuid | References `features_library(id)` on delete cascade |
| `industry_id` | uuid | References `industries(id)` on delete cascade |
| `relevance_score` | int | Default 50 |
| `industry_use_case` | text | Industry-specific use case |
| `related_pain_points` | text[] | Optional |
| `related_business_types` | text[] | Optional |
| `priority` | int | Default 0 |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

Additional migration variant:

- `smooth_admin_v4.sql` creates the same table with default `relevance_score = 80` and `priority = 50`.
- `smooth_admin_v4.sql` adds a unique index on `(feature_id, industry_id)`.

Indexes:

```sql
create index if not exists idx_feature_mapping_feature
on public.feature_industry_mapping(feature_id);

create index if not exists idx_feature_mapping_industry
on public.feature_industry_mapping(industry_id);

create unique index if not exists idx_feature_industry_unique
on public.feature_industry_mapping(feature_id, industry_id);
```

Current app status:

- Not selected in React.
- Not managed by visible admin UI.
- Should be integrated because business rules require Industry Mapping in recommendations.

### `feature_use_cases`

Purpose: Feature use cases, usually feature + industry specific.

Status: Created by migration.

Definition:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `feature_id` | uuid | References `features_library(id)` on delete cascade |
| `industry_id` | uuid | References `industries(id)` on delete cascade |
| `title` | text | Required |
| `pain_point` | text | Optional |
| `business_type` | text | Optional |
| `use_case` | text | Optional |
| `report_text` | text | Optional |
| `video_url` | text | Optional |
| `external_url` | text | Optional |
| `priority` | int | Default 0 |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

Fields written by app but not shown in create statement:

| Column | Type | Notes |
| --- | --- | --- |
| `is_star_feature` | boolean | App writes this in `UseCaseList`; migration does not define it |
| `star_score` | int | App writes this in `UseCaseList`; migration does not define it |

Indexes:

```sql
create index if not exists idx_feature_use_cases_feature
on public.feature_use_cases(feature_id);

create index if not exists idx_feature_use_cases_industry
on public.feature_use_cases(industry_id);
```

App operations:

- Admin select/insert/update.
- Report can load related use cases through `knowledge_items`.

Schema risk:

- If `is_star_feature` and `star_score` do not exist on this table in Supabase, saving use cases may fail.

### `feature_categories`

Purpose: Feature category/group metadata.

Status: Created by admin restore migrations.

Definition:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `name` | text | Required, unique |
| `description` | text | Optional |
| `sort_order` | int | Default 0 |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

Fields written by app but not shown in create statement:

| Column | Type | Notes |
| --- | --- | --- |
| `is_star_feature` | boolean | App writes this in `FeatureCategoryManager`; migration does not define it |
| `star_score` | int | App writes this in `FeatureCategoryManager`; migration does not define it |

Current app status:

- Admin loads this table.
- `FeatureCategoryManager` exists but is not mounted in visible tabs.

Schema risk:

- If mounted as-is, saving may fail unless extra fields exist.

### `knowledge_items`

Purpose: Legacy/general report knowledge content.

Status: Base table inferred; patch adds feature/use-case/media fields.

Columns added by migration:

| Column | Type | Notes |
| --- | --- | --- |
| `feature_id` | uuid | References `features_library(id)` on delete set null |
| `use_case_id` | uuid | References `feature_use_cases(id)` on delete set null |
| `image_url` | text | Optional |
| `video_url` | text | Optional |
| `updated_at` | timestamptz | Default now |

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `industry_id` | uuid | Optional; report loads industry-specific or null |
| `item_type` | text | e.g. `Demo Store`, `Case Study`, `Testimonial`, `CTA`, `Feature`, `Report Recommendation`, `Pain Point Solution` |
| `title` | text | Content title |
| `category` | text | Used for grouping/matching pain text |
| `content` | text | Main body copy |
| `external_link` | text | Link URL |
| `priority` | int | Sorting |
| `is_active` | boolean | Report only loads active items |
| `created_at` | timestamptz | Inferred |

App operations:

- Report selects active items by industry or null industry.
- Admin loads with related industry, feature, and use case.

## Report Asset Tables

### `report_assets`

Purpose: Reusable report content such as demo stores, testimonials, CTAs, fallback features, and reality checks.

Status: Base table inferred; migrations add columns.

Columns added by migrations:

| Column | Type | Notes |
| --- | --- | --- |
| `feature_id` | uuid | References `features_library(id)` on delete set null |
| `use_case_id` | uuid | References `feature_use_cases(id)` on delete set null |
| `logo_url` | text | Added by UI fixes migration |
| `image_url` | text | Added by UI fixes migration |
| `updated_at` | timestamptz | Default now |

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `industry_id` | uuid | References `industries(id)` |
| `asset_type` | text | `demo_store`, `case_study`, `testimonial`, `cta`, `feature`, `reality_check` |
| `title` | text | Asset title |
| `subtitle` | text | Secondary title/category |
| `description` | text | Body copy |
| `external_url` | text | Link URL |
| `video_url` | text | Video URL |
| `cta_label` | text | CTA button label, inferred from report use |
| `related_business_type` | text | Demo-store targeting |
| `related_pain_point` | text | Pain matching |
| `score_min` | numeric/int | Used by `pickAssets` |
| `score_max` | numeric/int | Used by `pickAssets` |
| `priority` | int | Sorting |
| `sort_order` | int | Admin writes from priority for demo stores |
| `is_active` | boolean | Report only loads active assets |
| `is_star_feature` | boolean | App writes for demo stores; migration not shown |
| `star_score` | int | App writes for demo stores; migration not shown |
| `created_at` | timestamptz | Inferred |

App operations:

- Report selects active assets by industry.
- Admin inserts/updates/deletes demo stores through this table.

Schema risk:

- App writes `is_star_feature` and `star_score`; migrations shown do not add those columns to `report_assets`.

## Pain Intelligence Tables

### `pain_points_master`

Purpose: Canonical pain-code list used to detect business pain areas from answers.

Status: Created by migration.

Definition:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `code` | text | Unique, required |
| `title` | text | Required |
| `description` | text | Optional |
| `category` | text | Optional |
| `keywords` | text[] | Used for detection |
| `is_active` | boolean | Default true |
| `priority` | int | Default 50 |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

App operations:

- Admin loads pain list.
- Report loads active pain points and detects codes from answer text.

### `pain_point_feature_mapping`

Purpose: Maps pain codes to recommended features by industry/stage.

Status: Base table existed before patches; migration adds columns.

Columns added by migration:

| Column | Type | Notes |
| --- | --- | --- |
| `pain_code` | text | Links to `pain_points_master.code` logically, no FK shown |
| `use_case_text` | text | Report recommendation/use case copy |
| `business_type` | text | Optional targeting |
| `stage_slug` | text | Stage filter |
| `relevance_score` | int | Default 50 |
| `is_active` | boolean | Default true |
| `updated_at` | timestamptz | Default now |

Fields used by app:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, inferred |
| `industry_id` | uuid | References `industries(id)`, inferred |
| `pain_point` | text | Display copy/title |
| `feature_id` | uuid | References `features_library(id)`, inferred |
| `priority` | int | Ranking |
| `recommendation_text` | text | Report feature copy |
| `created_at` | timestamptz | Inferred |

Indexes:

```sql
create index if not exists idx_ppfm_industry_code
on public.pain_point_feature_mapping(industry_id, pain_code);

create index if not exists idx_ppfm_feature
on public.pain_point_feature_mapping(feature_id);
```

App operations:

- Admin select/insert/update.
- Report selects active mappings by industry.
- Report joins related `features_library`.

Fields written by app but not shown in migration:

| Column | Type | Notes |
| --- | --- | --- |
| `is_star_feature` | boolean | App writes this in `PainMappingManager`; migration does not define it |
| `star_score` | int | App writes this in `PainMappingManager`; migration does not define it |

Schema risk:

- Saving pain mappings may fail if those two columns do not exist.

## Roadmap Tables

### `roadmap_templates`

Purpose: Action/worklist roadmap items by industry, stage, and pain code.

Status: Created by migration.

Definition:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `industry_id` | uuid | References `industries(id)` on delete cascade |
| `stage_slug` | text | Optional stage match |
| `pain_code` | text | Optional pain-code match |
| `phase` | text | Required, e.g. `First 30 Days` |
| `task_title` | text | Required |
| `task_description` | text | Optional |
| `expected_outcome` | text | Optional |
| `sort_order` | int | Default 0 |
| `priority` | int | Default 50 |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

Indexes:

```sql
create index if not exists idx_roadmap_templates_lookup
on public.roadmap_templates(industry_id, stage_slug, pain_code);
```

App operations:

- Report selects active roadmap templates by industry.
- Report filters by stage and detected pain codes.

## Legacy / Directionally Deprecated Tables

### `industry_hero_features`

Purpose: Maps industry/stage combinations to hero features.

Status: Created and used by current app, but conflicts with current product direction that there should be no Hero Feature module.

Definition:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `industry_id` | uuid | References `industries(id)` on delete cascade |
| `feature_id` | uuid | References `features_library(id)` on delete cascade |
| `stage_slug` | text | Optional stage filter |
| `hero_score` | int | Default 50 |
| `hero_reason` | text | Optional |
| `use_case_text` | text | Optional |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

Indexes:

```sql
create index if not exists idx_industry_hero_features_lookup
on public.industry_hero_features(industry_id, stage_slug, feature_id);
```

Fields written by app but not shown in create statement:

| Column | Type | Notes |
| --- | --- | --- |
| `is_star_feature` | boolean | App writes this in `HeroFeatureManager`; migration does not define it |
| `star_score` | int | App writes this in `HeroFeatureManager`; migration does not define it |

Current app operations:

- Admin loads it.
- `HeroFeatureManager` exists in code but is not mounted in current visible tabs.
- Report uses it inside recommended feature ranking.

Recommended direction:

- Retire this table from active recommendation logic after replacing behavior with `feature_industry_mapping`.

## CRM V2

Migration: `supabase/crm_v2.sql`

### `crm_leads`

Standalone sales leads. A lead may optionally reference a diagnostic through `submission_id`, but manual, cold-call, referral and campaign leads do not require a submission.

Important fields:

- Contact: `business_name`, `contact_name`, `phone`, `normalized_phone`, `email`, `city`
- Classification: `industry_id`, `source`, `source_detail`, `temperature`
- Sales process: `stage`, `priority_score`, `priority_label`, `estimated_value`, `assigned_to`
- Intelligence: `detected_pain_points`, `requirements`, `diagnostic_score`
- Follow-up: `next_action`, `next_followup_at`, `last_contacted_at`, `last_activity_at`
- Closure: `lost_reason`
- Provenance: optional unique `submission_id`

### `crm_followup_tasks`

Scheduled calls, WhatsApp messages, emails, meetings and demos. Tasks support status, outcome, rescheduling, ownership, prepared messages and media.

### `crm_followup_events`

Immutable-style activity timeline for lead creation, calls, messages, notes, task changes and pipeline-stage changes. `occurred_at` records when the activity happened; `metadata` allows additive details later.

### `crm_followup_templates`

Reusable, optionally industry- or pain-specific follow-up content. Templates remain independent from generated tasks so editing a template does not rewrite historical follow-ups.

All four CRM tables have RLS enabled by CRM V2 and grant full CRUD only to Supabase `authenticated` users. Public diagnostic users receive no CRM access.

## Supabase Storage

### Bucket: `feature-media`

Purpose: Public media files for feature sliders.

Migration:

```sql
insert into storage.buckets (id, name, public)
values ('feature-media', 'feature-media', true)
on conflict (id) do update set public = true;
```

Current policies:

- Public read for anon and authenticated users.
- Anon/authenticated upload.
- Anon/authenticated update.
- Anon/authenticated delete.

Security note:

- These policies are broad and suitable only for MVP/testing unless intentionally protected elsewhere. Production should restrict writes to authenticated admin users.

## Tables Mentioned But Not Used By App

### `generated_reports`

Only referenced in `local_testing_disable_rls.sql`.

No React queries found.

### `report_view_events`

Only referenced in `local_testing_disable_rls.sql`.

No React queries found.

## Row Level Security Notes

Several SQL files disable RLS:

- `submissions`
- `submission_answers`
- `industries`
- `question_sections`
- `questions`
- `question_options`
- `knowledge_items`
- `features_library`
- `report_assets`
- `generated_reports`
- `report_view_events`
- `feature_media`
- `feature_industry_mapping`
- `feature_use_cases`
- `feature_categories`
- `pain_points_master`
- `pain_point_feature_mapping`
- `roadmap_templates`
- `industry_hero_features`

Because OnlinDC is browser-only and uses the Supabase anon key in the frontend, RLS is the main production security boundary.

Recommended production policy model:

- Public read: active industries, active form sections/questions/options, active report content.
- Public insert: `submissions`, `submission_answers`.
- Public read by report slug: limited generated report/submission data.
- Authenticated admin read/write: all admin-managed content.
- Storage public read: feature media.
- Storage writes: authenticated admin only.

## Known Schema Drift And Risks

The current React code writes some columns that are not shown in the available migrations:

| Table | Columns |
| --- | --- |
| `feature_use_cases` | `is_star_feature`, `star_score` |
| `report_assets` | `is_star_feature`, `star_score` |
| `feature_categories` | `is_star_feature`, `star_score` |
| `pain_point_feature_mapping` | `is_star_feature`, `star_score` |
| `industry_hero_features` | `is_star_feature`, `star_score` |

Possible outcomes:

- These columns exist in the live Supabase database from an untracked migration.
- Or the corresponding admin saves may fail when used.

Other drift:

- `feature_industry_mapping` exists in SQL but is not used in React.
- `industry_hero_features` is used in React but no longer matches the desired product direction.
- The schema patches overlap, especially around feature/category/star support.

## Recommended Cleanup

1. Export the live Supabase schema and compare it with this inferred document.
2. Create a single canonical migration baseline.
3. Remove duplicate/obsolete SQL patch files after baseline is verified.
4. Add missing columns intentionally or remove app writes to invalid columns.
5. Integrate `feature_industry_mapping` into report recommendations.
6. Remove `industry_hero_features` from active app logic after replacement is confirmed.
7. Add production RLS policies.
