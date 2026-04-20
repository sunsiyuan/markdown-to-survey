# Tasks

Ordered, self-contained tasks for building MTS. Each task can be executed independently by a coding agent.

---

## Task 0: Git & OSS Scaffolding

**Goal:** Set up branch structure, license, contributing guide, and GitHub issue templates.

### Branch setup

Create and push an `init` branch from `main`. All Tasks 1-8 land on `init`. After all tasks pass, open a single PR `init → main`.

```bash
git checkout -b main
git checkout -b init
# ... all work happens here ...
# when done:
gh pr create --base main --head init --title "v0.1.0: MVP" --body "..."
```

### Files to create:

**`LICENSE`** (MIT):
```
MIT License

Copyright (c) 2026 markdown-to-survey contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
...
(standard MIT text)
```

**`CONTRIBUTING.md`:**
```markdown
# Contributing

## Setup
\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Branch conventions
- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- Always PR into `main`, never push directly

## Commit messages
- `task N: short description` (during initial build)
- `feat: description` / `fix: description` (after v0.1.0)

## Testing
- Parser: `pnpm --filter @mts/parser test`
- Web: `pnpm --filter web dev` then manual smoke test
```

**`.github/ISSUE_TEMPLATE/bug.md`:**
```markdown
---
name: Bug report
about: Something isn't working
---

**What happened?**

**Steps to reproduce**

**Expected behavior**

**Markdown input (if relevant)**
\`\`\`markdown

\`\`\`
```

**`.github/ISSUE_TEMPLATE/feature.md`:**
```markdown
---
name: Feature request
about: Suggest an idea
---

**What problem does this solve?**

**Proposed solution**

**Alternatives considered**
```

**`.github/pull_request_template.md`:**
```markdown
## What
<!-- One-line summary -->

## Why
<!-- Link to issue or explain motivation -->

## Test plan
- [ ] ...
```

**Done when:** `main` and `init` branches exist. LICENSE, CONTRIBUTING.md, and GitHub templates are committed on `init`.

---

## Task 1: Initialize Monorepo

**Goal:** Set up pnpm workspace monorepo with TypeScript.

**Create these files:**

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

`package.json` (root):
```json
{
  "name": "markdown-to-survey",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2",
    "typescript": "^5"
  }
}
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

`tsconfig.json` (root, base config):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

**Create directory structure:**
```
apps/
packages/
```

**Run:** `pnpm install`

**Done when:** `pnpm build` exits 0 (no packages yet, but turbo runs).

---

## Task 2: Create Parser Package

**Goal:** Build `packages/parser` — converts Markdown string to Survey JSON.

**Package setup:**

`packages/parser/package.json`:
```json
{
  "name": "@mts/parser",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest run",
    "dev": "tsup src/index.ts --format esm --dts --watch"
  },
  "dependencies": {
    "remark-parse": "^11",
    "unified": "^11",
    "nanoid": "^5"
  },
  "devDependencies": {
    "tsup": "^8",
    "vitest": "^3",
    "typescript": "^5"
  }
}
```

`packages/parser/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Source files to create:**

### `packages/parser/src/schema.ts`
Define TypeScript types:

```typescript
export interface Survey {
  title: string
  description?: string
  sections: Section[]
}

export interface Section {
  id: string
  title?: string
  description?: string
  questions: Question[]
}

export type QuestionType = 'single_choice' | 'multi_choice' | 'text' | 'matrix'

export interface Question {
  id: string
  type: QuestionType
  label: string
  description?: string
  required: boolean
  options?: Option[]
  rows?: MatrixRow[]
  columns?: string[]
}

export interface Option {
  id: string
  label: string
  hasTextInput?: boolean // for "Other: ___" options
}

export interface MatrixRow {
  id: string
  label: string
  options: Option[]
}
```

### `packages/parser/src/index.ts`
Main `parseSurvey(markdown: string): Survey` function.

**Parsing logic:**
1. Parse markdown with `unified().use(remarkParse)` to get MDAST
2. Walk the AST top-down:
   - First `heading` (depth 1) → `survey.title`
   - Text immediately after title, before first section → `survey.description`
   - `heading` (depth 2) → new `Section`
   - `strong` text containing `?` or matching pattern `/^[A-Z]\d+\./` → new `Question`
   - `list` with items starting with `☐` → choice question
     - If question text contains `可多选`, `多选`, `select all`, `multiple` → `multi_choice`
     - Otherwise → `single_choice`
   - `listItem` containing `___` (3+ underscores) or `其他：___` → `hasTextInput: true` on that option
   - Standalone `___` (not in a list) → `text` type question
   - `table` containing `☐` in cells → `matrix` question
   - `blockquote` → `description` on current section or question
   - `thematicBreak` (`---`) → section boundary (if no heading follows, treat as separator)

**Important edge cases to handle:**
- A question may have TWO sub-parts: a checkbox row + a list. **Flatten into separate questions** (simpler for results).
- Tables with multiple metadata columns + a checkbox column: parse the last column's `☐` items as options, other columns as row context.
- Bold labels followed by `___` (e.g. `**Date：** ___`) → text input question
- Bold labels followed by an instruction list (no `☐`) → description text, not a question

**ID generation:**
- Section IDs: `section_0`, `section_1`, ... (sequential)
- Question IDs: `q_0`, `q_1`, ... (sequential across all sections)
- Option IDs: `opt_0`, `opt_1`, ... (sequential within each question)

### `packages/parser/src/__tests__/parser.test.ts`

Create a test fixture at `packages/parser/src/__tests__/fixtures/sample-survey.md` using this sanitized example:

```markdown
# Product Feedback Survey

**Instructions:** Help us improve our product. Mostly multiple choice, about 5 minutes. Your answers are confidential.

**Date:** _______________　　**Name:** _______________

---

## A. Basic Information

**A1. What is your primary product category?**

Main category: ☐ Electronics　☐ Clothing　☐ Other: _______________

Percentage of total sales:
- ☐ 90% or more (almost exclusively this category)
- ☐ 60–90% (primary, with some others)
- ☐ Below 60% (multiple categories)

**A2. What is your minimum acceptable discount threshold?**

- ☐ Below 40% off — skip
- ☐ Below 30% off — skip
- ☐ Below 20% off — skip
- ☐ I evaluate every deal individually

**A3. What is your current top priority?** (select all that apply)

- ☐ Maximize revenue (accept thin margins)
- ☐ Protect margins (fewer deals is fine)
- ☐ Balance both, case by case

---

## B. Rate These Promotions

> Below are representative current promotions. For each, select your typical action.

**Legend:**
- **All in** = enroll everything that qualifies
- **Best sellers** = only high-volume items
- **New items** = use for zero-sale products to get traction
- **Skip** = we don't participate in this type

| # | Promo Type | Specific Promo | Discount | Min Stock | Duration | Your Action |
|---|-----------|---------------|:-------:|:---------:|:--------:|------------|
| 1 | Flash Sale | Spring 30% off, high traffic | ≥30% | 10 | 11 days | ☐All in ☐Best sellers ☐New items ☐Skip |
| 2 | Flash Sale | April 40% mega event | ≥40% | 30 | 31 days | ☐All in ☐Best sellers ☐New items ☐Skip |
| 3 | Flash Sale | Spring 25% special | ≥25% | 30 | 31 days | ☐All in ☐Best sellers ☐New items ☐Skip |
| 4 | Clearance | Midweek flash 45% off | ≥45% | 5 | 6 days | ☐All in ☐Best sellers ☐New items ☐Skip |

**B follow-up: For promos you marked "Skip", what's the main reason?** (select all that apply)

- ☐ Discount too deep, below cost
- ☐ Don't understand the rules or settlement
- ☐ Our category doesn't fit this format
- ☐ Tried before, poor results
- ☐ Other: _______________

---

## C. Preferences

**C1. How should the assistant present results?**

- ☐ Just do it automatically, I'll review after
- ☐ Show me a recommendation list, I confirm before submit
- ☐ Split into "recommended" and "for reference", I decide
- ☐ Only show me the uncertain ones, handle the rest automatically

**C2. What should the assistant always ask you about before acting?** (select all that apply)

- ☐ Deals near my discount threshold (±5%)
- ☐ When stock commitment exceeds 20 units
- ☐ New promotion types not seen last week
- ☐ Same product in 3+ active promotions
- ☐ Short flash deals (3 days or less)
- ☐ Always ask before any submission

**C3. In one sentence: what should the assistant NEVER do without asking?**

> _______________________________________________

---

**Additional comments (optional):**

> _______________________________________________
```

**Test cases:**
1. Parses title correctly: `"Product Feedback Survey"`
2. Parses description (the `Instructions` text)
3. Creates correct number of sections (3: A, B, C plus intro fields)
4. Question A2 is `single_choice` with 4 options
5. Question A3 is `multi_choice` (has `select all that apply`)
6. Section B table creates a `matrix` question with 4 rows
7. Question C3 is `text` type
8. Options with `Other: ___` have `hasTextInput: true`
9. Empty/whitespace-only markdown throws a clear error
10. Minimal markdown (just a title + one question) works

**Done when:** `pnpm --filter @mts/parser test` passes all 10 test cases.

---

## Task 3: Create Next.js Web App

**Goal:** Scaffold `apps/web` with Next.js, Tailwind, and Supabase client.

**Run from repo root:**
```bash
cd apps && pnpm create next-app web --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm
```

**Then add dependencies:**
```bash
cd apps/web && pnpm add @supabase/supabase-js nanoid @mts/parser
pnpm add -D @supabase/ssr
```

**Create `apps/web/lib/supabase.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Create `apps/web/.env.local.example`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Update `apps/web/package.json`** to add `@mts/parser` as workspace dependency:
```json
"dependencies": {
  "@mts/parser": "workspace:*"
}
```

**Done when:** `pnpm --filter web dev` starts without errors, shows Next.js welcome page.

---

## Task 4: Supabase Schema + API Routes

**Goal:** Create database migration and Next.js API routes for survey CRUD.

### Database migration

**Create `apps/web/supabase/migrations/001_init.sql`:**
```sql
CREATE TABLE surveys (
  id TEXT PRIMARY KEY,
  result_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,
  markdown TEXT NOT NULL,
  response_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES surveys(id),
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_responses_survey ON responses(survey_id);

ALTER PUBLICATION supabase_realtime ADD TABLE responses;

CREATE OR REPLACE FUNCTION increment_response_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE surveys SET response_count = response_count + 1
  WHERE id = NEW.survey_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_response_insert
AFTER INSERT ON responses
FOR EACH ROW EXECUTE FUNCTION increment_response_count();
```

### API Routes

**`apps/web/app/api/surveys/route.ts`** — POST: create survey
```
POST /api/surveys
Body: { "markdown": "# Survey..." }
Response 201: { "survey_url": "/s/{id}", "results_url": "/r/{result_id}", "question_count": N }
Error 400: { "error": "Failed to parse markdown: ..." }
```

Logic:
1. Extract `markdown` from request body
2. Call `parseSurvey(markdown)` from `@mts/parser`
3. Generate `id` and `result_id` with `nanoid(12)`
4. Insert into `surveys` table
5. Return URLs + question count

**`apps/web/app/api/surveys/[id]/route.ts`** — GET: survey schema
```
GET /api/surveys/{id}
Response 200: { "id", "title", "description", "schema", "response_count" }
Error 404: { "error": "Survey not found" }
```

**`apps/web/app/api/surveys/[id]/responses/route.ts`** — POST: submit, GET: results
```
POST /api/surveys/{id}/responses
Body: { "answers": { "q_0": "opt_1", "q_1": ["opt_0", "opt_2"], "q_2": "free text" } }
Response 201: { "id": "response_id" }

GET /api/surveys/{id}/responses
Response 200: { "count": N, "responses": [...] }
```

**Done when:** Can create a survey via curl, submit a response, and retrieve results. Test manually:
```bash
# Create survey
curl -X POST http://localhost:3000/api/surveys \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Test\n\n**Q1. Pick one?**\n\n- ☐ A\n- ☐ B"}'

# Submit response (use survey id from above)
curl -X POST http://localhost:3000/api/surveys/{id}/responses \
  -H "Content-Type: application/json" \
  -d '{"answers":{"q_0":"opt_0"}}'
```

---

## Task 5: Survey Page Frontend

**Goal:** Build the interactive survey form at `/s/[id]`.

### Page component: `apps/web/app/s/[id]/page.tsx`

- Server component that fetches survey schema from Supabase
- Passes schema to client `<SurveyForm>` component
- Shows 404 page if survey not found

### Components to create:

**`apps/web/components/survey/SurveyForm.tsx`** (client component)
- Receives `Survey` schema as prop
- Renders sections sequentially
- Tracks `answers` state: `Record<string, string | string[]>`
- Progress bar at top (% of questions answered)
- Submit button at bottom
- On submit: POST to `/api/surveys/{id}/responses`
- After submit: show `<ThankYou>` component
- Auto-save answers to `localStorage` key `mts_draft_{surveyId}`
- On mount: restore from localStorage if exists

**`apps/web/components/survey/QuestionCard.tsx`**
- Renders a single question based on `type`:
  - `single_choice`: radio buttons with labels
  - `multi_choice`: checkboxes with labels
  - `text`: textarea input
  - `matrix`: table with radio buttons per row
- Options with `hasTextInput` show an inline text field when selected
- Visual feedback on selection (highlight, subtle animation)

**`apps/web/components/survey/ProgressBar.tsx`**
- Thin bar at page top
- Shows % complete (answered questions / total questions)
- Smooth width transition

**`apps/web/components/survey/ThankYou.tsx`**
- "Thank you for your response!" message
- Simple, clean design

### Styling guidelines:
- White background, max-width 720px, centered
- Card-style sections with subtle shadow
- Font: system font stack (Inter if available)
- Primary color: `#2563eb` (blue-600)
- Option hover/selected: light blue background
- Mobile: full-width, larger touch targets (min 44px)
- Use Tailwind classes throughout

**Done when:** Can navigate to `/s/{id}` with a real survey, fill it out, submit, and see thank-you page. Answers appear in the `responses` table.

---

## Task 6: Results Dashboard Page

**Goal:** Build the results page at `/r/[id]` with live-updating charts.

### Page component: `apps/web/app/r/[id]/page.tsx`

- Server component that resolves `result_id` → `survey_id` via Supabase
- Fetches survey schema + current responses
- Passes to client `<ResultsDashboard>` component
- 404 if result_id not found

### Components:

**`apps/web/components/results/ResultsDashboard.tsx`** (client component)
- Shows survey title + total response count
- Renders a result card per question
- Subscribes to Supabase Realtime: `supabase.channel('responses').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses', filter: 'survey_id=eq.{id}' }, handleNewResponse)`
- On new response: add to local state, re-compute aggregations
- "Export CSV" button at bottom

**`apps/web/components/results/ChoiceResult.tsx`**
- For `single_choice` and `multi_choice` questions
- Horizontal bar chart showing each option's count + percentage
- Bars are proportional to max count
- Show count label on each bar
- Use Tailwind for bars (no charting library needed for MVP — pure CSS/div bars)

**`apps/web/components/results/TextResult.tsx`**
- For `text` questions
- List of text responses, most recent first
- Truncate long responses with "show more"

**`apps/web/components/results/MatrixResult.tsx`**
- For `matrix` questions
- Table showing counts per row × option
- Highlight the most-selected option per row

### Install: `pnpm add --filter web recharts` (only if CSS bars aren't sufficient)

**Done when:** Can visit `/r/{result_id}`, see aggregated results for all questions, and see the count update in real-time when a new response is submitted in another tab.

---

## Task 7: MCP Server Package

**Goal:** Create `packages/mcp-server` — an MCP server that Claude Code can use.

**`packages/mcp-server/package.json`:**
```json
{
  "name": "@mts/mcp-server",
  "version": "0.1.0",
  "type": "module",
  "bin": "dist/index.js",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1"
  },
  "devDependencies": {
    "tsup": "^8",
    "typescript": "^5"
  }
}
```

**`packages/mcp-server/src/index.ts`:**

```typescript
#!/usr/bin/env node
```

MCP server with two tools:

### Tool: `create_survey`
- **Input schema:** `{ markdown: string }` (required)
- **Description:** "Create an interactive survey from a Markdown string. Returns a survey URL for respondents and a results URL for the survey creator."
- **Logic:** POST to `{API_BASE_URL}/api/surveys` with the markdown
- **Output:** Formatted text:
  ```
  Survey created successfully!

  Survey URL (share with respondents): {survey_url}
  Results URL (view responses): {results_url}

  Questions: {question_count}
  ```

### Tool: `get_results`
- **Input schema:** `{ result_id: string }` (required)
- **Description:** "Get the current results of a survey by its result ID (from the results URL)."
- **Logic:**
  1. GET `{API_BASE_URL}/api/surveys/by-result/{result_id}` to get survey_id
  2. GET `{API_BASE_URL}/api/surveys/{survey_id}/responses`
  3. Aggregate results
- **Output:** Formatted text summary of results per question

**Config:**
- `API_BASE_URL` defaults to `https://mts.vercel.app` but can be overridden via `MTS_API_URL` env var

**Add a new API route for MCP:** `apps/web/app/api/surveys/by-result/[resultId]/route.ts`
- GET: lookup survey by `result_id`, return survey data + responses

**Done when:** Can add MCP server to Claude Code config, ask Claude to create a survey, and get back working URLs.

---

## Task 8: Landing Page

**Goal:** Simple landing page at `/` explaining what MTS does.

**`apps/web/app/page.tsx`:**
- Hero: "Markdown to Survey in seconds"
- Show the markdown syntax example + a preview of what it becomes
- "Try it" section: paste markdown → click create → get URLs
- Link to GitHub repo

Keep it simple — this is not the priority. One page, no external assets, pure Tailwind.

**Done when:** Landing page renders at `/` with a working "try it" form.

---

## Task 9: Deploy

**Goal:** Deploy to Vercel + set up Supabase.

### Supabase setup:
1. Create project on supabase.com (region: us-east-1)
2. Run migration: paste `001_init.sql` in SQL editor
3. Copy project URL + anon key

### Vercel setup:
1. Connect GitHub repo
2. Set root directory to `apps/web`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Verify:
1. Create survey via API
2. Fill out survey
3. Check results page updates in real-time

**Done when:** Production URLs work end-to-end.

---

# Roadmap (post v0.1.0)

After MVP ships, TASKS.md becomes a roadmap. Each item gets a GitHub Issue.

## v0.2.0 — Usability
- [ ] Conditional logic (show Q2 only if Q1 = "Yes")
- [ ] Survey expiration and response limits
- [ ] Password-protected surveys

## v0.3.0 — Scale
- [ ] User accounts + dashboard
- [ ] Custom domains
- [ ] Webhooks on new response
- [ ] Survey templates

## Parked — Response-rate layer

Distribution hypothesis: a meaningful chunk of agent outcomes depend on completion rate, not just schema correctness. Before building anything here, measure first.

### Step 1 — Funnel instrumentation (do this first)
- [ ] Record `opened` (first GET of `/s/{id}`), `started` (first answer change), `submitted` events per survey
- [ ] Surface a funnel in `get_results` / `GET /api/surveys/:id/responses` so agents (and we) can see where drop-off happens
- [ ] Decide next step only after ~50 real surveys of data: is the leak at share → open, open → start, or start → submit?

### Step 2 — Tiered UI customization (gated on Step 1 findings)
Only pursue the tier that addresses the observed leak. Keep the "semantic input, hosted rendering" contract — agents never write HTML/CSS.

- [ ] **Tier A — `theme` param** on `create_survey`: a few curated presets (`minimal`, `branded`, `playful`). Zero surface-area growth.
- [ ] **Tier B — `brand` object**: `{ logo, primary_color, welcome_message, thank_you_message }`. Agent-native, still semantic.
- [ ] **Tier C — plugin / custom component surface**: only if A+B measurably fail. Heavy commitment (sandbox, versioning, security).

**Why parked:** the product principle "narrow scope wins" makes Tier C a scope risk. A/B are in-scope because they still serve the agent's goal (higher completion → better agent outcome), not the human operator's aesthetic preferences.
