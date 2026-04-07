# Markdown to Survey (MTS)

The survey layer for AI agents.

MTS lets an agent ask humans for structured input:

```text
Agent needs input
  → writes survey in Markdown or JSON schema
  → calls MTS
  → gets a shareable survey URL
  → humans respond
  → agent retrieves structured JSON results
```

## What is this?

MTS is a minimal API and MCP server for one narrow job: ask humans questions and get machine-usable answers back.

It is designed for:
- AI agents that need human input mid-workflow
- Developers building agent products that need a lightweight survey primitive

It is not designed for:
- survey dashboards
- visual form builders
- template libraries
- email campaigns
- analytics/reporting UI

## Features

- **Markdown or JSON schema input** — fast for humans, precise for agents
- **MCP server** — create surveys and read results directly from Claude Code
- **Minimal API surface** — authenticated creator routes, public respondent submission
- **Four semantic question types** — `choice`, `text`, `scale`, `matrix`
- **Conditional logic** — `showIf` in Markdown and JSON schema
- **Explicit lifecycle** — close surveys, expiry, and max response limits

## Product Principles

- **Semantic over visual**: MTS has a small protocol, not a zoo of UI-specific field types.
- **AI-first I/O**: agents write the survey and agents consume the results; humans are in the middle.
- **Everything is an API**: creator functionality must be available over authenticated HTTP and MCP.
- **Narrow scope wins**: if a feature mainly serves human survey operators, it probably does not belong here.

## Supported Question Types

- `single_choice`
- `multi_choice`
- `text`
- `scale`
- `matrix`

## Markdown Syntax

```markdown
# Survey Title

**Description:** Instructions for the respondent.

## Section Name

**Q1. Your question here?**

- ☐ Option A
- ☐ Option B
- ☐ Option C

**Q2. Multi-select question?** (select all that apply)

- ☐ Choice 1
- ☐ Choice 2
- ☐ Choice 3

**Q3. Open-ended question:**

> _______________

| # | Item | Rating |
|---|------|--------|
| 1 | Item A | ☐Good ☐OK ☐Bad |
| 2 | Item B | ☐Good ☐OK ☐Bad |
```

Scale questions:

```markdown
**Q4. How severe is this issue?**

[scale 1-5 min-label="Low" max-label="Critical"]
```

Conditional logic:

```markdown
**Q1. Did the deploy fail?**

- ☐ Yes
- ☐ No

**Q2. Which step failed?**

> show if: Q1 = "Yes"

> _______________________________________________
```

## Quick Start

### Use with Claude Code

Add to your Claude Code config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "survey": {
      "command": "npx",
      "args": ["-y", "@mts/mcp-server"],
      "env": {
        "MTS_API_KEY": "mts_sk_your_key_here"
      }
    }
  }
}
```

Then in Claude Code:
```
> Create a survey from docs/my-survey.md
```

Available tools:
- `create_survey`
- `get_results`
- `list_surveys`
- `close_survey`

### Use the HTTP API

```bash
curl -X POST https://www.humansurvey.co/api/keys \
  -H "Content-Type: application/json" \
  -d '{"name":"my claude agent"}'
```

Then create a survey:

```bash
curl -X POST https://www.humansurvey.co/api/surveys \
  -H "Authorization: Bearer mts_sk_..." \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# My Survey\n\n**Q1. How are you?**\n\n- ☐ Great\n- ☐ OK\n- ☐ Not great"}'
```

Response:
```json
{
  "survey_url": "/s/abc123",
  "question_count": 1
}
```

Read results:

```bash
curl https://www.humansurvey.co/api/surveys/abc123/responses \
  -H "Authorization: Bearer mts_sk_..."
```

## Public Surface

- Docs page: `https://www.humansurvey.co/docs`
- OpenAPI: `https://www.humansurvey.co/api/openapi.json`
- AI index: `https://www.humansurvey.co/llms.txt`

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js (App Router) |
| Database | Neon (serverless Postgres) |
| Parser | remark (unified ecosystem) |
| Frontend | React + Tailwind CSS |
| MCP Server | @modelcontextprotocol/sdk |
| Deployment | Vercel |

## Project Structure

```
├── apps/web/          # Next.js app (API + frontend)
├── packages/parser/   # Markdown → Survey JSON parser
├── packages/mcp-server/ # MCP server for Claude Code
└── docs/              # Architecture docs
```

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR. The most important rule is scope discipline: new UI variants, analytics dashboards, and human-operator features are usually out of scope.

## Development

```bash
pnpm install
pnpm dev              # Start Next.js dev server
pnpm --filter @mts/parser test
pnpm build            # Build all packages
```

## License

MIT
