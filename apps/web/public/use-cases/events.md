# Event feedback, the AI-native way

_Use case · Event organizers_

Canonical: https://www.humansurvey.co/use-cases/events

You just ran a conference, a meetup, or a webinar. Now comes the part everyone dreads: getting structured feedback from attendees while it's still fresh, writing a retro your speakers and sponsors can actually read, and deciding what to change for next time. **This page is about making your AI agent run that whole loop — session ratings, open text, speaker-specific feedback, and a grounded synthesis — before the attendees log off for the day.**

---

## The old way

Rebuild a post-event Typeform, one row per session in a matrix question. Export the attendee list from Eventbrite or Luma. Send them the link with a generic "we'd love your feedback" subject line. 22% respond. Export the CSV. Open Sheets. Sort by session. Paste open-text responses into a doc and try to summarize. Tell the keynote speaker "people loved it" and the workshop host "there were some comments" based on vibes. Send a retro Slack message three days later that half the org skims.

None of that is broken — it's just slow, and it leaves a mountain of nuance on the cutting-room floor. The synthesis step is the one that actually matters for deciding what to change next time, and it's the step a human is least good at when tired on a Sunday evening.

## The new loop

HumanSurvey is a small hosted-form service fronted by an MCP server and a REST API. Your agent — Claude Code, Claude Desktop, Cursor, any MCP client — takes on three jobs:

1. Designs the schema from your intent: per-session matrix ratings, an overall NPS, open text, and whatever speaker-specific or sponsor-specific questions you want.
2. Creates the survey and returns `/s/{id}`. You drop the link in the event Slack, Discord, or the day-of attendee email. Or ask your agent to post to the channel if it has that tool.
3. Reads the results and synthesizes — by session, by track, by speaker, by sponsor — into whatever format you need (retro doc, per-speaker email drafts, sponsor-facing PDF).

The whole point is that an organizer (often a volunteer or a very tired full-timer) doesn't spend Sunday night pivoting a spreadsheet. The agent does the reading. You review the output.

## Worked example — post-conference retro

You organized a two-day developer conference. Four tracks, 22 sessions, 380 attendees. Monday morning, you open Claude Code with HumanSurvey installed and say:

> "Run our post-conference feedback survey. Matrix: for each of these 22 sessions, 1–5 rating and would-recommend yes/no. Overall NPS for the whole conference. Open text: what should we change next year? Multi-choice: which tracks do you want more of? Keep it 4 minutes max, expires Friday."

You paste in the session list from the event page. Claude generates the schema — the matrix question is the one organizers always write badly by hand, and the agent gets the row/column shape right on the first try:

```json
{
  "title": "DevConf 2026 — your feedback",
  "description": "4 minutes. Helps us plan DevConf 2027.",
  "sections": [{
    "questions": [
      { "type": "matrix",
        "label": "Rate each session you attended (1–5; skip if you didn't go)",
        "rows": [
          "Keynote — What's next for open-source databases",
          "Track A: Building an agent-native backend",
          "Track A: Workshop — MCP server basics",
          "Track B: From prototype to 10M requests/day",
          "Track C: Fireside — the future of serverless"
          /* … 17 more rows … */
        ],
        "columns": ["1", "2", "3", "4", "5", "N/A"]
      },
      { "type": "scale",
        "label": "How likely are you to recommend DevConf to a colleague?",
        "min": 0, "max": 10,
        "minLabel": "Not at all", "maxLabel": "Definitely" },
      { "type": "multi_choice",
        "label": "Which tracks do you want more of next year?",
        "options": [
          { "label": "Databases & storage" },
          { "label": "Agent infrastructure" },
          { "label": "Scaling & performance" },
          { "label": "Developer experience" },
          { "label": "Security" }
        ]
      },
      { "type": "text", "label": "One thing we should change next year?" }
    ]
  }],
  "max_responses": 500,
  "expires_at": "2026-04-24T23:59:00Z"
}
```

Claude calls `create_survey` and returns `https://www.humansurvey.co/s/evt445`. You drop it into the post-event attendee email and pin it in the #general Slack channel. By Thursday, 241 responses are in. You ask Claude:

> "Summarize DevConf feedback, grouped by track. Include what to change."

Claude calls `get_results` and returns:

```
241 responses (63%). NPS: 56 (strong).

Top-rated sessions:
  1. Keynote — Open-source databases  (4.7 / 5, 92% recommend)
  2. Track B workshop — 10M req/day   (4.6 / 5, 88% recommend)
  3. Fireside — future of serverless  (4.5 / 5, 85% recommend)

Bottom-rated sessions:
  1. Track A: MCP server basics       (3.1 / 5, 41% recommend)
     → open text theme: "too basic, expected deeper content"
  2. Track C: Security panel          (3.3 / 5, 48% recommend)
     → open text theme: "panelists talked past each other"

Track demand for next year:
  1. Agent infrastructure (71%)  ← clear #1, up from 52% last year
  2. Scaling & performance (54%)
  3. Developer experience (48%)
  4. Databases & storage (33%)
  5. Security (22%)

Top "what to change" themes (from 188 open-text responses):
  1. Longer breaks between sessions (47 mentions)
  2. Food queue was too slow on Day 2 (31 mentions)
  3. Track A needs advanced content, not intro talks (24 mentions)
  4. More ad-hoc unconference space (18 mentions)

Suggested moves for DevConf 2027:
  1. Double the agent-infra track — demand has shifted there.
  2. Rework Track A content design — split beginner vs advanced.
  3. Extend between-session breaks to 20 min (currently 10).
  4. Fix food logistics on Day 2 — separate queue or staggered lunch.
  5. Send per-speaker feedback packets (Claude can draft these).
```

Then you ask Claude to draft per-speaker emails with the relevant slice of the data, which it does grounded in the raw JSON — each speaker gets their own rating, their own open-text comments, and nothing about the other 21 sessions.

## Other event scenarios that fit the same loop

- **Pre-event expectation survey.** Two weeks before the event, ask registered attendees what they're hoping to get out of it. Your agent cross-checks against the agenda and flags mismatches so you can adjust session framing or prep speakers.
- **Mid-event daily pulse.** For multi-day conferences, send a short end-of-Day-1 survey. If something's going wrong (food, AV, pacing), you find out in time to fix Day 2 — not in the retro three weeks later.
- **Sponsor feedback.** Post-event, ask sponsors about booth traffic quality, lead capture, and whether they'd sponsor again. Your agent drafts a sponsor-facing retro PDF grounded in their own responses plus overall attendee metrics.
- **Speaker self-reflection.** A private survey sent to speakers only — what worked, what they'd change about their slot, venue/AV issues. Keeps institutional knowledge in a machine-readable form for next year's program committee.
- **Meetup / community retro.** Smaller, faster cadence. 3 questions, closes in 48 hours, your agent reads the results and updates the next month's meetup agenda proposal automatically.
- **Webinar / online workshop feedback.** Triggered at the end of the Zoom/Meet session. Quick NPS, one ranking question on which follow-up topic people want, one open text. Your agent compiles the list and feeds it into your next-session planning.

## How this compares

Event feedback tools fall into three rough shapes — platforms with bundled surveying, general form builders, and agent-native infrastructure. Pick based on who is going to consume the output:

| Tool              | Build                          | Read                           |
| ----------------- | ------------------------------ | ------------------------------ |
| Sched / Whova     | Human, in the event platform   | Human, platform dashboard      |
| Typeform          | Human, visual builder          | Human, dashboard               |
| Eventbrite survey | Human, bundled tool            | Human, CSV export              |
| Google Forms      | Human, visual builder          | Human, Sheets                  |
| HumanSurvey       | Agent, from plain language     | Agent, structured JSON         |

If your event is already running on Sched or Whova and you have time to read the responses by eye, use the bundled survey. If you're a volunteer meetup organizer who just wants structured feedback without extra tooling, HumanSurvey is probably the lowest overhead — especially if Claude is already the tool you use to draft the post-event email.

## Getting started in two steps

1. Add HumanSurvey as an MCP server in Claude Code (`~/.claude.json`). Full config snippet in the docs: https://www.humansurvey.co/docs
2. Ask Claude: _"create an API key for HumanSurvey."_ It calls `create_key`. Next time an event wraps, describe the retro you want — Claude does the rest.

## More

- Community feedback use case: https://www.humansurvey.co/use-cases/community-feedback
- Product launch use case: https://www.humansurvey.co/use-cases/product-launch
- FAQ: https://www.humansurvey.co/faq
