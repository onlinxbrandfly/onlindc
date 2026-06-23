# OnlinDC Architecture

## Overview

OnlinDC is a browser-only React application backed directly by Supabase. There is no separate application server in this repository. The frontend performs authentication, database reads/writes, storage uploads, scoring, report generation logic, and admin management flows.

```text
Browser React App
  |-- Supabase Auth
  |-- Supabase Database
  |-- Supabase Storage
  |-- External links: Onlin.in, WhatsApp, YouTube/video URLs
```

## Runtime Architecture

### Entry Point

File: `src/main.jsx`

Responsibilities:

- Imports global CSS.
- Initializes root React app.
- Reads current path from `window.location.pathname`.
- Tracks Supabase auth session.
- Performs simple manual routing.

Route behavior:

```text
/                -> PublicDiagnostic
/report/:slug    -> ReportPage
/admin/login     -> AdminLogin
/admin           -> AdminApp if authenticated, otherwise AdminLogin
```

### Supabase Client

File: `src/services/supabase.js`

The app creates one Supabase client using a project URL and public anon key.

All database and storage access is currently performed directly from React components.

## Frontend Modules

### Public Diagnostic

File: `src/public/PublicDiagnostic.jsx`

Responsibilities:

- Load active industries.
- Load form sections and questions for selected industry.
- Load active options for those questions.
- Collect user answers.
- Validate required answers.
- Calculate score.
- Derive readiness stage.
- Insert into `submissions`.
- Insert into `submission_answers`.
- Create report slug and report URL.

Main data flow:

```text
industries
  -> question_sections
  -> questions
  -> question_options
  -> score calculation
  -> submissions
  -> submission_answers
  -> /report/:slug
```

Scoring:

- Text/email/phone/number/textarea answers do not contribute score.
- Single/select questions use the selected option score multiplied by question weight.
- Multiple-choice questions sum selected option scores multiplied by question weight.
- Percentage is `totalScore / maxScore * 100`.

Stage mapping is defined in `src/utils/reportUtils.js`.

### Admin Login

File: `src/admin/AdminLogin.jsx`

Responsibilities:

- Email/password login with Supabase Auth.
- Navigate to `/admin` after successful login.

### Admin App

File: `src/admin/AdminApp.jsx`

Responsibilities:

- Admin shell/sidebar.
- Dashboard.
- Submissions list and submission modal.
- Form builder.
- Question editor.
- Knowledge Centre.
- Feature manager.
- Feature media manager.
- Use case manager.
- Demo store manager.
- Pain mapping manager.
- Industry manager.

Current admin tabs:

```text
Dashboard
Submissions
Form Builder
Knowledge Centre
Industries
```

Current Knowledge Centre sub-tabs:

```text
Features
Use Cases
Demo Stores
Pain Mapping
```

Admin data loading:

`AdminApp.loadAll()` loads many tables in parallel:

- `submissions`
- `submission_answers`
- `industries`
- `question_sections`
- `questions`
- `question_options`
- `knowledge_items`
- `features_library`
- `feature_use_cases`
- `feature_media`
- `report_assets`
- `feature_categories`
- `pain_points_master`
- `pain_point_feature_mapping`
- `industry_hero_features`

### Report Page

File: `src/report/ReportPage.jsx`

Responsibilities:

- Load a report submission by slug or id.
- Load answers and enrichment content.
- Detect pain codes from answers.
- Build report data.
- Render report sections.
- Render feature experience modal.
- Render video modal.

Report data loading:

- `submissions` with related `industries`
- `submission_answers` with related `questions`
- `report_assets`
- `features_library`
- `knowledge_items`
- `feature_media`
- `pain_points_master`
- `pain_point_feature_mapping`
- `roadmap_templates`
- `industry_hero_features`

Report builder functions currently live inside `ReportPage.jsx`:

- `buildRecommendedFeatures`
- `buildRoadmap`
- `buildReality`
- `detectPainCodes`
- `collectAnswerText`
- `groupByPhase`
- `defaultReality`
- `defaultRoadmap`
- `dedupeByTitle`
- `toEmbed`

## Database Architecture

The repository contains iterative SQL patch files in `supabase/`. They are not organized as a single canonical migration chain, but together describe the current working schema.

### Diagnostic Form Tables

#### `industries`

Represents business categories.

Used by:

- Public industry selector
- Admin industry list
- Form builder
- Report filtering
- Content mapping

#### `question_sections`

Represents sections within an industry-specific diagnostic form.

Used by:

- Public diagnostic step flow
- Admin form builder

#### `questions`

Represents diagnostic questions.

Important fields used by app:

- `industry_id`
- `section_id`
- `question_text`
- `question_key`
- `question_type`
- `placeholder`
- `help_text`
- `weight`
- `is_required`
- `is_active`
- `sort_order`

#### `question_options`

Represents answer options for choice questions.

Important fields used by app:

- `question_id`
- `option_text`
- `option_value`
- `score`
- `score_label`
- `help_text`
- `is_active`
- `sort_order`

### Submission Tables

#### `submissions`

Stores one completed diagnostic.

Important fields used by app:

- `industry_id`
- `business_name`
- `owner_name`
- `phone`
- `email`
- `total_score`
- `score_percentage`
- `readiness_stage`
- `report_summary`
- `report_slug`
- `report_url`
- `report_generated_at`

#### `submission_answers`

Stores answers for each submission.

Important fields used by app:

- `submission_id`
- `question_id`
- `answer_text`
- `selected_option_texts`
- `score`

### Report Content Tables

#### `report_assets`

General report content table used for demo stores and fallback content.

Used asset types include:

- `demo_store`
- `case_study`
- `testimonial`
- `cta`
- `feature`
- `reality_check`

#### `knowledge_items`

Legacy/general knowledge content table still used by report logic.

Current report logic reads item types such as:

- `Demo Store`
- `Link`
- `Case Study`
- `Testimonial`
- `CTA`
- `Feature`
- `Report Recommendation`
- `Pain Point Solution`

#### `features_library`

Master list of Onlin features.

Important fields:

- `name`
- `slug`
- `global_feature`
- `feature_category`
- `short_description`
- `feature_link`
- `video_url`
- `icon_url`
- `priority`
- `is_active`
- `is_star_feature`
- `star_score`

#### `feature_use_cases`

Feature-specific use cases, optionally industry-specific.

Important fields:

- `feature_id`
- `industry_id`
- `title`
- `pain_point`
- `business_type`
- `use_case`
- `report_text`
- `video_url`
- `external_url`
- `priority`
- `is_active`

#### `feature_media`

Feature media records linked to `features_library`.

Important fields:

- `feature_id`
- `media_type`
- `media_url`
- `caption`
- `sort_order`
- `is_active`

Stored files are uploaded to the `feature-media` Supabase Storage bucket.

#### `feature_industry_mapping`

Maps features to industries.

Current status:

- Created by SQL patches.
- Seeded in at least one SQL script.
- Not currently loaded by `ReportPage`.
- Not currently managed by visible admin UI.

This table should become important because product rules say feature recommendations must include Industry Mapping.

#### `pain_points_master`

Master list of pain codes.

Important fields:

- `code`
- `title`
- `description`
- `category`
- `keywords`
- `priority`
- `is_active`

Used by report pain detection.

#### `pain_point_feature_mapping`

Maps pain codes to recommended features.

Important fields:

- `industry_id`
- `pain_code`
- `pain_point`
- `feature_id`
- `priority`
- `relevance_score`
- `recommendation_text`
- `use_case_text`
- `business_type`
- `stage_slug`
- `is_active`

Used by report recommendation logic.

#### `roadmap_templates`

Action/worklist roadmap templates.

Important fields:

- `industry_id`
- `stage_slug`
- `pain_code`
- `phase`
- `task_title`
- `task_description`
- `expected_outcome`
- `sort_order`
- `priority`
- `is_active`

Used by report roadmap logic.

#### `industry_hero_features`

Legacy/current hero feature mapping.

Current status:

- Created and seeded by SQL patches.
- Loaded by admin.
- Loaded and used by report recommendations.
- Conflicts with current product direction: no Hero Feature module.

### Supporting / Unused Tables

#### `feature_categories`

Created and fetched by admin, but `FeatureCategoryManager` is not mounted in the current admin UI.

#### `generated_reports`

Referenced in local RLS SQL only.

#### `report_view_events`

Referenced in local RLS SQL only.

## Storage Architecture

### Bucket: `feature-media`

Configured by `supabase/feature_media_manager_v1.sql`.

Used for:

- Feature slider images
- Feature videos uploaded through admin

Current SQL creates broad public/anon policies for MVP testing. Production policies should be tightened.

## Report Recommendation Architecture

Current `buildRecommendedFeatures` ranking sources:

1. Pain mappings from `pain_point_feature_mapping`
2. Star features from `features_library`
3. Hero features from `industry_hero_features`
4. Knowledge items linked to features
5. Fallback report assets with `asset_type = "feature"`

Current priority behavior:

- Pain mappings receive highest base priority.
- Star features receive next high priority.
- Hero features receive another priority boost.
- Knowledge items receive lower priority.
- Fallback assets are used only when no feature result exists.

Current mismatch:

- `feature_industry_mapping` is not included.
- `industry_hero_features` is included despite the desired no-Hero-Feature direction.

Target recommendation sources:

1. Pain Point Mapping
2. Industry Mapping
3. Star Features

## Roadmap Architecture

Current roadmap logic is action-based, not feature-based.

Data source:

- `roadmap_templates`

Selection logic:

- Match by current stage slug.
- Match by detected pain codes.
- Boost pain-code matches.
- Sort by sort order and priority.
- Deduplicate by task title.
- Fallback to a hardcoded default roadmap.

This is aligned with the product rule that Growth Roadmap should be action/worklist based.

## Styling Architecture

All styles are currently in `src/styles/global.css`.

The file contains:

- Theme variables
- Public diagnostic styles
- Admin dashboard styles
- Form builder styles
- Knowledge Centre styles
- Report styles
- Modal styles
- Feature media styles
- CTA/report polish styles
- Responsive styles
- Print styles

Current issue:

- The stylesheet is large and has repeated selectors.
- It should eventually be split by app area or component group.

## Build And Deployment

### Scripts

```bash
npm run dev
npm run build
npm run preview
```

### Vite

File: `vite.config.js`

Configuration:

- React plugin.
- Dev server host `0.0.0.0`.
- Dev server port `3000`.

### Cloudflare Pages

Expected deployment target is Cloudflare Pages.

Recommended SPA fallback:

```text
/* /index.html 200
```

No `_redirects` file is currently present in the repository.

## Security Notes

The app is browser-only, so Supabase Row Level Security is the main security boundary.

Current SQL files disable RLS on many public tables, including:

- `submissions`
- `submission_answers`
- `industries`
- `question_sections`
- `questions`
- `question_options`
- `knowledge_items`
- `features_library`
- `report_assets`
- `pain_points_master`
- `pain_point_feature_mapping`
- `roadmap_templates`
- `feature_media`
- `feature_industry_mapping`
- `industry_hero_features`

This is acceptable only for local testing or MVP experimentation. Production needs RLS policies that separate:

- Public read access for active diagnostic/report content.
- Public insert access for submissions and submission answers.
- Authenticated admin write access for admin-managed content.
- Storage read/upload/update/delete policies appropriate to admin usage.

## Main Scalability Problems

1. `AdminApp.jsx` contains too many unrelated modules.
2. `ReportPage.jsx` mixes data loading, business logic, and rendering.
3. Supabase access is spread across React components.
4. Report recommendation logic is not isolated or tested.
5. SQL patches overlap and should be consolidated into a canonical migration history.
6. Product rules and implementation are drifting around hero features and industry mapping.
7. Admin UX lacks a central toast/notification system.
8. No automated tests exist for critical scoring and recommendation behavior.

## Recommended Future Structure

```text
src
├─ app
│  ├─ App.jsx
│  └─ routes.js
├─ services
│  ├─ supabase.js
│  ├─ adminService.js
│  ├─ diagnosticService.js
│  ├─ reportService.js
│  └─ storageService.js
├─ modules
│  ├─ diagnostic
│  ├─ report
│  └─ admin
├─ components
│  ├─ ui
│  ├─ admin
│  └─ report
├─ logic
│  ├─ scoring.js
│  ├─ painDetection.js
│  ├─ recommendations.js
│  └─ roadmap.js
├─ styles
│  ├─ base.css
│  ├─ admin.css
│  ├─ diagnostic.css
│  └─ report.css
└─ utils
```

## Refactor Priority

1. Extract report business logic from `ReportPage.jsx`.
2. Remove or retire Hero Feature flow after confirming replacement behavior.
3. Add `feature_industry_mapping` to recommendation loading and ranking.
4. Split `AdminApp.jsx` by module.
5. Add section delete and complete question/option persistence.
6. Add admin toast notifications and scroll preservation.
7. Add Cloudflare Pages SPA fallback.
8. Replace broad RLS-disabled setup with production policies.
