# OnlinDC Project Context

## Purpose

OnlinDC is an industry diagnostic and sales enablement platform for Onlin.in. It helps a business answer industry-specific diagnostic questions and receive a shareable digital readiness report that can be used by the Onlin sales team for follow-up, demos, and conversion.

The product is both:

- A public diagnostic experience for business owners.
- An internal admin tool for managing forms, industries, recommendations, feature content, demo stores, and report content.

## Business Outcome

The platform should identify where a business currently stands digitally, expose practical gaps, and connect those gaps to relevant Onlin.in features and next actions.

The report is intended to include:

1. Score
2. Current Stage
3. Reality Check and Pain Points
4. Industry Comparison
5. Growth Roadmap
6. Recommended Onlin Features
7. Demo Stores
8. Case Studies
9. Testimonials
10. Book Demo CTA

## Current User Flows

### Public Diagnostic Flow

1. User opens the root route `/`.
2. User selects a business category or industry.
3. The app loads active form sections, questions, and options for that industry from Supabase.
4. User answers questions section by section.
5. The app calculates a weighted score from selected answer options.
6. The app creates a submission and answer rows in Supabase.
7. The app generates a report slug and report URL.
8. User can open or copy the generated report link.

### Report Flow

1. User opens `/report/:slug`.
2. The app loads the submission by `report_slug`; if not found, it tries the slug as a submission id.
3. The app loads answers and report enrichment data from Supabase.
4. The report builds detected pain codes, reality checks, roadmap items, recommended features, demo stores, case studies, testimonials, and CTA content.
5. User can print the report, open feature details, watch videos, open demo stores, or contact Onlin.

### Admin Flow

1. Admin opens `/admin`.
2. If no Supabase auth session exists, the app shows the login screen.
3. After login, admin can use dashboard tabs.
4. Current admin areas include:
   - Dashboard
   - Submissions
   - Form Builder
   - Knowledge Centre
   - Industries

## Core Modules

### Form Builder

Responsible for managing industry-specific diagnostic forms.

Current capabilities:

- Add sections.
- Edit section title and description.
- Add questions.
- Edit questions.
- Duplicate questions.
- Hide or show questions.
- Delete questions.
- Add, edit, and delete question options from the question editor.
- Duplicate a complete form from one industry to another.

Known gaps:

- Section delete is not implemented.
- Some question editor fields are displayed but not fully persisted.
- Option metadata fields are displayed but not fully persisted.

### Industry Management

Responsible for managing business categories.

Current capabilities:

- Add industry name and slug.
- List existing industries.

Known gaps:

- No edit flow.
- No delete flow.
- No active/inactive toggle.
- No sort-order management.

### Features and Media Management

Responsible for managing Onlin features and their media.

Current capabilities:

- Add and edit features.
- Store feature link, video URL, icon URL, category/group, priority, active flag, star feature flag, and star score.
- Open a media panel from a feature row.
- Upload feature images/videos to Supabase Storage.
- Add video URLs as feature media.
- Edit media caption and sort order.
- Hide/show/delete media.

Important rule:

- Feature media should be merged with Features.
- There should not be a separate Feature Media page.

Current state:

- Media is partially merged into the Features tab as a panel.
- The implementation is still a separate `FeatureMediaManager` component inside the admin file.

### Pain Point Mapping

Responsible for mapping detected pain codes to recommended Onlin features.

Current capabilities:

- Map industry + pain code + stage to a feature.
- Store priority, relevance score, recommendation text, and use case text.

Important rule:

- Recommended features should use Pain Point Mapping, Industry Mapping, and Star Features.

Current state:

- Pain mapping is used by the report.
- Star features are used by the report.
- `feature_industry_mapping` exists in SQL but is not used by the current report logic.

### Demo Stores

Responsible for report demo-store cards.

Current capabilities:

- Manage demo stores through `report_assets` with `asset_type = "demo_store"`.
- Store title, subtitle, description, logo/image URL, external URL, related business type, related pain point, priority, active flag.

### Report Builder / Report Engine

Responsible for assembling report content from submission answers and Supabase content tables.

Current report sections:

- Current Stage
- Reality Check
- Growth Roadmap
- How Onlin Helps
- Demo Stores
- Case Studies
- Testimonials
- Bottom CTA

Known gap:

- Industry Comparison is expected by the product requirements but is not currently rendered as a distinct section.

### Knowledge Centre

Current admin sub-tabs:

- Features
- Use Cases
- Demo Stores
- Pain Mapping

Current state:

- The old/general `knowledge_items` table is still read by the report and admin data loader.
- The visible admin Knowledge Centre now focuses more on features, use cases, demo stores, and pain mappings.

## Business Rules

### Features

- One feature can belong to multiple industries.
- One feature can have multiple use cases.
- Features have:
  - Feature Link
  - Video Link
  - Images
  - Star Feature toggle

### Recommended Features

Recommended features should be based on:

1. Pain Point Mapping
2. Industry Mapping
3. Star Features

Current mismatch:

- The report currently does not read `feature_industry_mapping`.
- The report still uses `industry_hero_features`, even though Hero Feature module should not exist going forward.

### Growth Roadmap

- Growth Roadmap should not be feature based.
- It should be action/worklist based.

Current state:

- Roadmap uses `roadmap_templates`, pain codes, stage, and default worklist fallbacks.
- This is aligned with the action/worklist rule.

### Admin UX

Required:

- No auto-save.
- Explicit Save buttons.
- Preserve active tab.
- Preserve scroll position.
- Success notifications.

Current state:

- Explicit save buttons are used in most admin forms.
- Active admin tab is preserved in `localStorage`.
- Knowledge Centre sub-tab is preserved in `localStorage`.
- Scroll position is not preserved.
- Success notifications are inconsistent. Most flows use failure alerts only; duplicate form has a success toast.

### UI

Brand colors:

- Blue: `#195FA6`
- White
- Black

Current styling:

- Global CSS defines `--blue: #195FA6`, `--black`, `--bg`, `--line`, `--text`, and `--muted`.
- Admin, public diagnostic, and report styles are all in one large `global.css`.

## Current Technical State

### Stack

- React
- Vite
- Supabase Database
- Supabase Auth
- Supabase Storage
- Recharts
- Cloudflare Pages deployment target

### Routing

Routing is manual in `src/main.jsx` using `window.location.pathname`, `history.pushState`, and `popstate`.

Routes:

- `/` renders public diagnostic.
- `/report/:slug` renders report.
- `/admin/login` renders admin login.
- `/admin` renders admin app when authenticated, otherwise login.

### Authentication

Admin authentication uses Supabase Auth with email/password login.

There is no app-level role check in React beyond requiring an authenticated Supabase session.

### Deployment Consideration

Because the app uses client-side routing, Cloudflare Pages should be configured to serve `index.html` for deep links such as `/report/:slug` and `/admin`.

The repository does not currently contain a visible Cloudflare Pages `_redirects` file.

## Known Risks And Gaps

- Supabase anon key is embedded in the frontend, which is normal for Supabase, but it requires strict Row Level Security policies.
- Several SQL scripts disable Row Level Security for public tables, which is unsafe for production.
- Hero Feature code still exists even though the product direction says no Hero Feature module.
- Industry mapping table exists but is not integrated into report recommendations.
- Report lacks a distinct Industry Comparison section.
- Admin components are too large and tightly coupled.
- There is no dedicated data access layer.
- There is no test coverage for scoring, pain detection, roadmap selection, or recommendation ranking.
- Some displayed UI characters appear mojibake-encoded in source output, suggesting encoding issues.

## Change Management Rule

Before making changes, document:

1. Files that will change.
2. Database changes.
3. Possible side effects.
4. Confirmation request.

Do not overwrite working functionality without confirmation.
