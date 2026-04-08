# HumanSurvey

[![human-survey MCP server](https://glama.ai/mcp/servers/sunsiyuan/human-survey/badges/card.svg)](https://glama.ai/mcp/servers/sunsiyuan/human-survey)

Feedback collection infrastructure for AI agents.

HumanSurvey lets an agent doing long-horizon work collect structured feedback from a group of people:

```text
Agent is doing a job
  → needs structured feedback from a group
  → creates survey from JSON schema
  → shares /s/{id} URL with respondents
  → humans respond over hours or days
  → agent retrieves structured JSON results and acts on them
```

## What is this?

HumanSurvey is a minimal API and MCP server for one narrow job: let agents collect structured feedback from groups of humans and get machine-usable results back.

It is designed for:
- AI agents running event management, product launches, or community workflows that need to survey a group
- Developers building agent products that need a lightweight feedback-collection primitive

It is not designed for:
- survey dashboards
- visual form builders
- template libraries
- email campaigns
- analytics/reporting UI

## Features

- **JSON schema input** — structured, precise, and directly machine-generated
- **MCP server** — create surveys and read results directly from Claude Code
- **Minimal API surface** — authenticated creator routes, public respondent submission
- **Four semantic question types** — `choice`, `text`, `scale`, `matrix`
- **Conditional logic** — `showIf` in Markdown and JSON schema
- **Explicit lifecycle** — close surveys, expiry, and max response limits

## Product Principles

- **Semantic over visual**: HumanSurvey has a small protocol, not a zoo of UI-specific field types.
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
      "args": ["-y", "humansurvey-mcp"],
      "env": {
        "HUMANSURVEY_API_KEY": "hs_sk_your_key_here"
      }
    }
  }
}
```

Then in Claude Code:
```
> Create a post-event feedback survey with a 1-5 rating, open text, and a yes/no question
```

Available tools:
- `create_key` — self-provision an API key; no human setup required
- `create_survey` — create from JSON schema; optional `max_responses`, `expires_at`, `webhook_url`
- `get_results` — aggregated results + raw responses
- `list_surveys` — list surveys owned by your key
- `close_survey` — close a survey immediately

### Use the HTTP API

```bash
curl -X POST https://www.humansurvey.co/api/keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my claude agent",
    "email": "you@example.com",
    "wallet_address": "eip155:8453:0xabc..."
  }'
```

All fields optional. `wallet_address` uses [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-10.md) format — will be used for agent-native payments in the future.

Then create a survey:

```bash
curl -X POST https://www.humansurvey.co/api/surveys \
  -H "Authorization: Bearer hs_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "schema": {
      "title": "Post-Event Feedback",
      "sections": [{
        "questions": [
          { "type": "scale", "label": "How would you rate the event?", "min": 1, "max": 5 },
          { "type": "text", "label": "What should we improve?" }
        ]
      }]
    }
  }'
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
  -H "Authorization: Bearer hs_sk_..."
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
