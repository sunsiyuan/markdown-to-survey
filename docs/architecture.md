# Architecture

## Overview

MTS (Markdown to Survey) is a three-component system:

```
┌──────────────┐      ┌───────────────────┐      ┌─────────────────────┐
│ Claude Code  │─MCP─▶│  MCP Server       │─API─▶│  Next.js on Vercel  │
│ (user's IDE) │      │  (local process)  │      │                     │
└──────────────┘      └───────────────────┘      │  ┌─── API Routes    │
                                                  │  ├─── Survey Page   │
                                                  │  └─── Results Page  │
                                                  └────────┬────────────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │  Supabase   │
                                                    │  Postgres   │
                                                    │  + Realtime │
                                                    └─────────────┘
```

## Components

### 1. Parser (`packages/parser`)

The core engine. Converts Markdown text into a structured Survey JSON schema.

**Pipeline:**
```
Markdown string
  → remark parse (Markdown → MDAST)
  → Custom transformer (MDAST → Survey tokens)
  → Schema builder (tokens → Survey JSON)
  → Validation
```

**Key design decisions:**
- Uses `remark` (unified ecosystem) for reliable Markdown AST parsing
- Custom MDAST visitor that recognizes survey patterns (checkboxes, tables, fill-in fields)
- Stateful parser that tracks current section and question context
- Outputs a self-contained JSON schema that the frontend renders without needing the original markdown

**Detection heuristics:**
- Single choice vs multi choice: look for `可多选`, `select all`, `multiple` hints in question text
- Question boundaries: bold text (`**...**`) containing `?` or numbered pattern (`A1.`, `Q1.`)
- Text inputs: `___` patterns (3+ underscores)
- Matrix questions: tables containing `☐` in cells

### 2. Web App (`apps/web`)

Next.js App Router application with three responsibilities:

**API Routes:**
- `POST /api/surveys` — Accepts markdown, runs parser, stores in Supabase, returns URLs
- `GET /api/surveys/[id]` — Returns survey schema for rendering
- `POST /api/surveys/[id]/responses` — Stores a completed survey response
- `GET /api/surveys/[id]/results` — Returns aggregated results

**Survey Page (`/s/[id]`):**
- Server component fetches survey schema
- Client component renders interactive form
- Section-by-section navigation with progress indicator
- Auto-saves to localStorage (keyed by survey ID)
- On submit: POST to API, show thank-you page

**Results Page (`/r/[id]`):**
- Resolves `result_id` → `survey_id` on server
- Fetches current results on load
- Subscribes to Supabase Realtime for live updates
- Renders charts per question type

### 3. MCP Server (`packages/mcp-server`)

Lightweight Node.js process that Claude Code spawns via `npx`.

**Tools:**
| Tool | Input | Output |
|------|-------|--------|
| `create_survey` | `{ markdown: string }` | `{ survey_url, results_url, question_count }` |
| `get_results` | `{ results_url: string }` | `{ response_count, questions: [{ label, summary }] }` |

The MCP server calls the hosted API — it does not run the parser locally (so the parser version is always consistent with what the backend expects).

## Database Design

Two tables in Supabase Postgres:

```
surveys
├── id (TEXT PK)              — nanoid, used in /s/{id}
├── result_id (TEXT UNIQUE)   — separate nanoid, used in /r/{id}
├── title (TEXT)
├── description (TEXT)
├── schema (JSONB)            — full survey definition
├── markdown (TEXT)           — original source
├── response_count (INT)     — denormalized, updated by trigger
└── created_at (TIMESTAMPTZ)

responses
├── id (TEXT PK)
├── survey_id (TEXT FK → surveys.id)
├── answers (JSONB)           — { "q_a1": "option_2", "q_a2": ["opt_1", "opt_3"], ... }
└── created_at (TIMESTAMPTZ)
```

**Why two IDs per survey?**
- `id` is in the survey URL — shared with respondents
- `result_id` is in the results URL — only the creator knows it
- This gives link-based access control without authentication

**Realtime:**
- The `responses` table is added to `supabase_realtime` publication
- Results page subscribes to `INSERT` events filtered by `survey_id`
- On new response: increment local count, re-aggregate affected questions

## Survey JSON Schema

```typescript
interface Survey {
  title: string
  description?: string
  sections: Section[]
}

interface Section {
  id: string           // e.g., "section_a"
  title?: string       // e.g., "A. 你的商品基本情况"
  description?: string // from blockquotes
  questions: Question[]
}

type QuestionType = 'single_choice' | 'multi_choice' | 'text' | 'matrix' | 'composite'

interface Question {
  id: string           // e.g., "q_a1"
  type: QuestionType
  label: string        // The question text
  description?: string // Additional context
  required: boolean
  options?: Option[]         // for choice types
  rows?: MatrixRow[]         // for matrix type
  columns?: MatrixColumn[]   // for matrix type
  subQuestions?: Question[]  // for composite questions
}

interface Option {
  id: string
  label: string
  hasTextInput?: boolean  // for "其他：___" options
}

interface MatrixRow {
  id: string
  label: string
  cells: { [columnId: string]: string }  // display text per column
}

interface MatrixColumn {
  id: string
  label: string
  options: Option[]  // the selectable options in this column
}
```

## Security Considerations

- **No auth for MVP** — link-based access only
- Survey IDs are nanoid (12 chars, ~35 bits entropy) — not guessable
- Result IDs are separate nanoids — knowing a survey URL doesn't reveal results
- API rate limiting via Vercel's built-in edge middleware
- Input sanitization: markdown is parsed into structured data, never rendered as raw HTML
- Supabase Row Level Security: not needed for MVP (all surveys are public-by-link)

## Future Considerations

- User accounts and dashboard (manage all your surveys)
- Custom themes and branding
- Conditional logic (show question B only if answer to A is X)
- Survey templates
- Webhooks on new responses
- Password-protected surveys
- Expiration dates and response limits
