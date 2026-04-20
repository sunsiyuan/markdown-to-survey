# Post-launch feedback, the AI-native way

_Use case · Indie makers / PMs_

Canonical: https://www.humansurvey.co/use-cases/product-launch

You shipped something. Maybe it went well on Product Hunt — 600 upvotes, 240 sign-ups. Maybe it was a quiet beta drop to your waitlist of 400. Either way, the next question is the same: _what do these early users actually think?_ **This page is about running that feedback loop through an AI agent, end to end — schema in, synthesis out, no Typeform and no spreadsheet.**

---

## The old way

Open Typeform or Google Forms. Rebuild a post-launch survey from scratch — NPS, some open text, maybe a feature ranking grid. Duplicate in Canny or Intercom Surveys if you want product-managed voting. Drop the link in the welcome email. Follow up three days later with a reminder. Export the CSV. Skim 140 rows of feedback. Open a doc. Try to write a coherent synthesis. Triage feature requests by hand. Manually update the top five into your Linear or GitHub roadmap.

Every step of that pipeline assumes a human is doing the reading. But if you already have Claude or Cursor open while you're building your product — and you almost certainly do — the shape of the right tool changes. The agent can design the schema, own the loop, and hand you a grounded synthesis. The hosted form becomes an implementation detail.

## The new loop

HumanSurvey is a thin, opinionated survey API plus an MCP server. Your agent already has context — it knows your product, your positioning, and the questions that are actually open for you right now. You tell it what you want to learn. It does the rest:

1. Designs the schema from your intent — NPS, choice questions with options from your positioning hypotheses, scales for pricing signal, open text for qualitative.
2. Creates the survey, returns `/s/{id}`. You paste into the welcome email, Discord, or Slack. Or ask your agent to post if it has an email/channel tool.
3. On demand, retrieves results and summarizes. "What did our first users say?" becomes a structured answer with percentages, themes, and suggested moves — all grounded in actual response JSON.

Nothing in this loop requires you to leave your agent conversation. No tab-switching, no export-to-CSV, no "I'll read the responses this weekend" that turns into never.

## Worked example — post-launch survey for your first 200 sign-ups

You launched a new analytics tool for e-commerce stores. 240 people signed up in the first 48 hours. You want to learn: is the positioning landing, what's the biggest friction, are people willing to pay at your intended price? You open Claude Code with HumanSurvey installed and say:

> "Survey our first 200 sign-ups. I want: NPS 0–10; why they signed up (the positioning options: replacing their current analytics / integrating with Shopify / because of our pricing / the AI-summary feature); biggest paper cut so far as open text; would they pay at $29/month (yes / maybe / no). Keep it 2 minutes."

Claude generates a schema roughly like:

```json
{
  "title": "How's it going so far?",
  "description": "Two minutes. Helps us prioritize what to build next.",
  "sections": [{
    "questions": [
      { "type": "scale", "label": "How likely are you to recommend us to a friend?",
        "min": 0, "max": 10,
        "minLabel": "Not at all", "maxLabel": "Definitely" },
      { "type": "multi_choice", "label": "Why did you sign up?",
        "options": [
          { "label": "Replacing my current analytics tool" },
          { "label": "Native Shopify integration" },
          { "label": "The pricing is better than alternatives" },
          { "label": "The AI summary feature" },
          { "label": "Other" }
        ]
      },
      { "type": "text", "label": "Biggest paper cut so far?" },
      { "type": "single_choice", "label": "Would you pay $29 / month for this?",
        "options": [
          { "label": "Yes" }, { "label": "Maybe" }, { "label": "No" }
        ]
      }
    ]
  }],
  "max_responses": 240,
  "expires_at": "2026-04-27T23:59:00Z"
}
```

Claude calls `create_survey`, returns `https://www.humansurvey.co/s/lnc789`. You drop it in the welcome email Resend automation. A week later, you ask:

> "What did our first users say?"

Claude calls `get_results` and returns:

```
112 responses (56%). NPS: 42.
  — 38% promoters, 44% passives, 18% detractors.
  — Detractor theme (open text): slow initial data sync.

Why they signed up:
  1. Native Shopify integration (63%) — clear lead.
  2. AI summary feature (51%).
  3. Replacing current analytics (28%) ← the positioning we lead with.
  4. Pricing (22%).

Biggest paper cut (top themes from 94 open-text responses):
  1. Google SSO missing (41 mentions) — by far the loudest.
  2. Initial data sync is slow (18 mentions) — matches detractor NPS cluster.
  3. No way to invite teammates yet (12 mentions).

Pricing at $29/month: 67% yes, 24% maybe, 9% no.
At $39/month (follow-up segment): 48% yes. Demand curve
  suggests $29 is close to the right anchor.

Suggested moves:
  1. Rewrite the hero: lead with Shopify integration, not
     "replacing your analytics tool".
  2. Ship Google SSO this week — it's the #1 loudest complaint.
  3. Diagnose the initial sync latency — it's hitting both the
     paper-cut list and the detractor segment.
  4. Anchor pricing at $29; test $35 in a later cohort.
```

Every number and theme in that synthesis is traceable back to the raw JSON. You didn't read 112 responses by hand. You didn't triage by gut feel. And you got a concrete list of four actions you can execute before lunch.

## Other launch scenarios that fit the same loop

- **Waitlist warm-up survey.** Before you ship, ask your waitlist which features they'd use first, what they're currently paying elsewhere, and what would unlock them switching. Free, early positioning data.
- **Private-beta weekly pulse.** Every Friday during beta, send beta users a 3-question check — what they tried this week, what broke, what would they ship next. Your agent stitches the weekly results into a running changelog-driven narrative.
- **Pricing validation (van Westendorp style).** Four scale questions on price sensitivity. Your agent computes the optimal price range and tells you where to anchor.
- **Churn / cancellation exit survey.** Triggered when a user downgrades. Structured reasons + free text. Agent surfaces the top-three recurring reasons monthly and flags individual responses worth replying to.
- **Rolling NPS on a cohort basis.** One survey per monthly sign-up cohort with an `expires_at` of +30 days. Your agent graphs NPS by cohort and tells you if recent product changes moved the number.

## How this compares

Post-launch feedback tools fall into three rough buckets. Pick the one that matches how your feedback will be consumed:

| Tool              | Build                          | Read                          |
| ----------------- | ------------------------------ | ----------------------------- |
| Typeform          | Human, visual builder          | Human, dashboard              |
| Canny             | Users post feature requests    | Human, vote dashboard         |
| Intercom Surveys  | Human, in-platform             | Human, Intercom dashboard     |
| Google Forms      | Human, visual builder          | Human, Sheets                 |
| HumanSurvey       | Agent, from plain language     | Agent, structured JSON        |

If you're going to read every response yourself, Typeform has a nicer reading experience. If you want users to post and vote on feature requests as a running list, Canny is a different shape of product. HumanSurvey is the right pick when your agent is already in the loop and you want the synthesis to flow back into its context — not a dashboard you'll open once a week.

## Getting started in two steps

1. Add HumanSurvey as an MCP server in Claude Code (`~/.claude.json`). Full config snippet in the docs: https://www.humansurvey.co/docs
2. Ask Claude: _"create an API key for HumanSurvey."_ It calls `create_key`. Next time you want to survey your users, just describe what you want to learn.

## More

- Community feedback use case: https://www.humansurvey.co/use-cases/community-feedback
- Events use case: https://www.humansurvey.co/use-cases/events
- FAQ: https://www.humansurvey.co/faq
