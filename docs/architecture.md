# Architecture

MTS is the survey infrastructure layer for AI agents. The system is intentionally narrow: agents create surveys, humans answer them, and agents retrieve structured results.

## System Overview

```
┌──────────────┐      ┌───────────────────┐      ┌─────────────────────┐
│ AI agent     │─MCP─▶│  MCP Server       │─API─▶│  Next.js on Vercel  │
│ or app code  │      │  (local process)  │      │                     │
└──────────────┘      └───────────────────┘      │  ┌─── API Routes    │
                                                  │  ├─── Survey Page   │
                                                  │  └─── Docs / llms   │
                                                  └────────┬────────────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │    Neon     │
                                                    │  Postgres   │
                                                    └─────────────┘
```

The flow is intentionally small:

1. An agent creates a survey from Markdown or JSON schema.
2. MTS stores the normalized survey schema and returns a respondent URL.
3. Humans submit responses through the hosted survey page.
4. The creator retrieves structured results through the authenticated API or MCP.

## Architecture Principles

- Semantic over visual: the protocol exposes 5 schema variants but only 4 semantic classes: `single_choice`, `multi_choice`, `text`, `matrix`, `scale`. UI variants do not become protocol types.
- API first: anything available in the web UI must also exist as an authenticated API or MCP operation.
- Structured outputs: results are returned as machine-usable JSON with per-question aggregation, not only presentation text.
- Explicit lifecycle: surveys can be open, closed, expired, or full. Submission logic and rendering both enforce the same lifecycle rules.

## Main Components

### 1. Parser (`packages/parser`)

The parser converts Markdown survey syntax into the canonical Survey JSON schema used everywhere else.

Pipeline:

```
Markdown
  → remark parse
  → survey-specific node inspection
  → normalized Survey JSON
  → validation / ID assignment
```

Responsibilities:

- Recognize question structure from Markdown
- Normalize to stable IDs (`section_0`, `q_0`, `opt_0`, ...)
- Support both human-authored Markdown and feature parity with JSON schema input
- Export the shared schema types consumed by the web app and MCP server

Supported semantic question types:

- `single_choice`
- `multi_choice`
- `text`
- `matrix`
- `scale`

`composite` is intentionally not part of the schema. When Markdown contains multiple adjacent input blocks, they are represented as sequential questions.

### 2. Web App (`apps/web`)

The Next.js app serves both the machine-facing API and the human-facing survey form.

API responsibilities:

- `POST /api/keys` creates API keys
- `GET /api/keys` and `DELETE /api/keys/[id]` manage keys
- `POST /api/surveys` creates surveys from Markdown or JSON schema
- `GET /api/surveys` lists surveys for the authenticated creator
- `GET /api/surveys/[id]` returns public survey metadata/schema for respondents
- `PATCH /api/surveys/[id]` updates lifecycle state
- `POST /api/surveys/[id]/responses` stores respondent answers
- `GET /api/surveys/[id]/responses` returns raw responses plus aggregated question data

Page responsibilities:

- `/s/[id]` renders the survey form, enforces closed/expired/full state, and submits responses
- `/docs`, `/llms.txt`, and `/api/openapi.json` make the product discoverable to developers and agents

There is intentionally no browser results dashboard. Results access is defined by the authenticated API and MCP tools.

### 3. MCP Server (`packages/mcp-server`)

The MCP server is a thin authenticated client over the hosted API.

Responsibilities:

- Accept survey definitions from agents
- Call the API with `Authorization: Bearer ${MTS_API_KEY}`
- Format creator-friendly text output for MCP tools
- Preserve access to structured results through the underlying API response shapes

Core tools:

- `create_survey`
- `get_results`
- `list_surveys`
- `close_survey`

## Access Model

Results access is based on API key auth, not a second public URL. The access model is:

- Respondents use the public survey URL: `/s/{survey_id}`
- Creators use API key auth for creation, listing, lifecycle changes, and results retrieval
- MCP tools use the same API key auth model as direct HTTP clients

This keeps the creator surface consistent across web API, MCP, and future SDKs.

## Data Model

The database keeps a normalized ownership model plus denormalized counters for fast reads.

```
api_keys
├── id (TEXT PK)
├── key_hash (TEXT UNIQUE NOT NULL)
├── name (TEXT)
├── created_at (TIMESTAMPTZ)
└── last_used_at (TIMESTAMPTZ)

surveys
├── id (TEXT PK)
├── api_key_id (TEXT FK → api_keys.id)
├── title (TEXT NOT NULL)
├── description (TEXT)
├── schema (JSONB NOT NULL)
├── markdown (TEXT)
├── response_count (INT DEFAULT 0)
├── status (TEXT NOT NULL DEFAULT 'open')
├── max_responses (INT)
├── expires_at (TIMESTAMPTZ)
└── created_at (TIMESTAMPTZ)

responses
├── id (TEXT PK)
├── survey_id (TEXT FK → surveys.id)
├── answers (JSONB NOT NULL)
└── created_at (TIMESTAMPTZ)
```

Notes:

- `schema` stores the canonical survey definition used by the form renderer and results aggregation.
- `response_count` is denormalized and maintained server-side for quick lifecycle checks.
- Lifecycle fields live on the survey itself so both API and UI can make the same availability decision.

## Survey Schema Shape

```typescript
interface Survey {
  title: string
  description?: string
  sections: Section[]
}

interface Section {
  id: string
  title?: string
  description?: string
  questions: Question[]
}

type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'text'
  | 'matrix'
  | 'scale'

interface Question {
  id: string
  type: QuestionType
  label: string
  description?: string
  required: boolean
  options?: Option[]
  rows?: MatrixRow[]
  columns?: MatrixColumn[]
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  showIf?: Condition
}
```

The schema is shared across parser, API handlers, renderer, and MCP formatting. The system should not have multiple incompatible interpretations of the same survey.

## Results Pipeline

`GET /api/surveys/[id]/responses` is the canonical results endpoint.

It returns:

- `count`: total response count
- `questions`: per-question aggregates ready for UI or agent reasoning
- `raw`: complete individual responses for export or custom analysis

Aggregation is computed once on the server so every consumer sees the same statistics:

- choice questions expose tallies
- scale questions expose count, mean, median, and distribution
- text questions expose recent responses
- matrix questions expose row and option breakdowns

This aggregated shape is intended for agents and API clients first, not a browser analytics UI.

## Security Model

- API keys are stored hashed, never plaintext after creation
- Creator endpoints require `Authorization: Bearer mts_sk_...`
- Respondent endpoints remain public by design
- Markdown is parsed into structured schema, not rendered as raw HTML
- Ownership checks happen at the survey API boundary using `api_key_id`

## Planned Extension Points

The current architecture deliberately leaves room for:

- OpenAPI publication and generated SDKs
- future webhooks without changing the survey schema contract
- additional SDKs layered on the same HTTP contract
