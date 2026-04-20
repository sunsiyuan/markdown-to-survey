# Community feedback, the AI-native way

_Use case · Community / brand managers_

Canonical: https://www.humansurvey.co/use-cases/community-feedback

If you run a Discord, Telegram, or Slack community — or a brand audience on any channel — you already know the ritual. Something happens (an AMA, a drop, a campaign, a controversial proposal). You want to know what your members thought. You open Typeform, rebuild a rating form from scratch, share the link, nag people, wait a week, and eventually paste responses into a spreadsheet to spot the themes. **This page is about replacing that entire loop with a single sentence to your AI.**

---

## The old way

Run a Typeform / Google Forms / SurveyMonkey form. Build the questions in a visual editor. Copy the link. Drop it in `#general`. Ping people again 48 hours later. Export the CSV. Skim 180 rows. Write a post summarizing what you read. Lose half the nuance because you were tired. The form itself takes 20 minutes; the synthesis takes an hour; the chasing takes days.

This worked when the best tool for collecting structured input from a group was a hosted form with a dashboard. It is no longer the best tool — not because forms are broken, but because the _consumer of the responses_ has changed. If an AI is going to read the results and do the next thing, the form doesn't need a dashboard. It needs an API.

## The new loop

HumanSurvey is a minimal, hosted form plus an MCP server and a REST API. Your agent — Claude, Cursor, or anything that speaks MCP — does three things on your behalf:

1. Designs the survey from your plain-language request. No form builder, no JSON.
2. Creates the survey and hands you a `/s/{id}` share URL. You paste it in your community channel (or ask your agent to post it if it has a Slack/Discord tool).
3. Reads the responses and synthesizes them for you, on demand. "What did people think?" becomes a real question with a real structured answer.

HumanSurvey itself never contacts your audience. It returns you a link; distribution is your job or your agent's job. That's deliberate — the audience list belongs to you, not to this service.

## Worked example — post-AMA feedback

You just wrapped a Friday AMA with a guest speaker in a Discord server of ~400 members. Saturday morning, you open Claude Code with the HumanSurvey MCP installed and say:

> "Run a post-AMA feedback survey for Friday's session. I want a 1–5 rating for the session overall, one question asking what topics they want us to cover next, and an open text asking what we should change. Keep it under 2 minutes."

Claude generates something like:

```json
{
  "title": "Friday AMA — your feedback",
  "description": "Under 2 minutes. Helps us plan the next one.",
  "sections": [{
    "questions": [
      { "type": "scale", "label": "Rate the session", "min": 1, "max": 5,
        "minLabel": "Poor", "maxLabel": "Excellent" },
      { "type": "multi_choice", "label": "Topics you want next?",
        "options": [
          { "label": "Infra scaling" },
          { "label": "Pricing models" },
          { "label": "Hiring your first engineer" },
          { "label": "Fundraising" },
          { "label": "Product-market fit" }
        ]
      },
      { "type": "text", "label": "One thing we should change next time?" }
    ]
  }],
  "max_responses": 500,
  "expires_at": "2026-04-23T23:59:00Z"
}
```

Claude calls `create_survey` and returns:

```
Survey created.
Respondent URL: https://www.humansurvey.co/s/abc123
3 questions · expires in 72 hours · max 500 responses
```

You paste the URL into your `#ama-recap` channel. 184 people click it over the next two days. Tuesday morning, you ask Claude:

> "How did the AMA land?"

Claude calls `get_results` and returns a synthesis grounded in the actual JSON:

```
184 responses (46% of active members).
Average rating: 4.3 / 5.
Top requested next topic: "Infra scaling" (60% — clear lead).
Runner-up: "Hiring your first engineer" (31%).
Common theme in open text: "too many mid-session interruptions"
  — 34 responses mention it. A few want the guest to answer
  submitted questions earlier rather than taking live ones.

Suggested next move: schedule an infra-scaling AMA and adopt a
"collected questions first, live Q&A at the end" format.
```

That synthesis came from machine-readable JSON, not a human squinting at a dashboard. Total operator time: about 90 seconds of typing, spread across two mornings.

## Other community scenarios that fit the same loop

- **Campaign / drop reactions.** After a merch drop or a limited edition release, collect 3–5 targeted questions about pricing perception, product details, and follow-up buying intent.
- **Community pulse.** Monthly NPS-style check-in, with a conditional text field that only appears if the score is ≤ 6. Your agent flags dissatisfied members for you to follow up with directly.
- **Policy vote.** Proposing a new community rule? Collect approve/reject + reasons in 72 hours. Your agent can be told _"only publish the announcement if approval > 70%"_.
- **Event retro.** After a meetup or conference, rate sessions in a matrix and capture what to do differently — your agent writes the public retro post for you.
- **Creator-economy feedback.** Podcasters and newsletter operators collect structured reactions to episodes or issues without leaving their workflow.

## How this compares

HumanSurvey is not trying to be a better Typeform. It's a different product category: feedback infrastructure for when the consumer of the results is an AI, not a PM.

| Tool          | Build the form                | Read the results              |
| ------------- | ----------------------------- | ----------------------------- |
| Typeform      | Human, in a visual builder    | Human, in a dashboard         |
| Google Forms  | Human, in a visual builder    | Human, in Sheets              |
| Discord poll  | Human, slash command          | Human, in chat (yes/no only)  |
| HumanSurvey   | Agent, from plain language    | Agent, structured JSON        |

If a PM is going to read the responses by eye, use Typeform — its form design is better and the dashboard is polished. If you just need a one-off free form and have no AI in your workflow, Google Forms is fine. HumanSurvey is the right pick when an agent is already in your loop and you want the results to flow straight into its context.

## Getting started in two steps

1. Add HumanSurvey as an MCP server in Claude Code (`~/.claude.json`). See the full config snippet in the docs: https://www.humansurvey.co/docs
2. Ask Claude for an API key: _"create an API key for HumanSurvey."_ It calls `create_key` and stores the result. You're done — next time you want to collect feedback, just tell Claude what you want to learn.

## More

- FAQ — anonymity, distribution, pricing, agent compatibility: https://www.humansurvey.co/faq
- Docs — JSON schema, MCP tools, conditional logic: https://www.humansurvey.co/docs
- Product launch use case: https://www.humansurvey.co/use-cases/product-launch
- Events use case: https://www.humansurvey.co/use-cases/events
