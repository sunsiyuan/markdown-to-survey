# HumanSurvey FAQ

Short answers to what community managers, brand teams, indie makers, and developers ask before connecting HumanSurvey to their agent.

Canonical: https://www.humansurvey.co/faq

---

## Can Claude (or another AI) actually send a survey to my community for me?

Yes. With HumanSurvey connected as an MCP server, you tell Claude what you want to learn — it generates the survey schema, creates the survey, and returns a `/s/{id}` share link. Distribution is up to you or your agent: you paste the link into Discord / Slack / an email, or ask your agent to post it if it has a Slack/Discord/email tool connected. HumanSurvey doesn't email-blast on your behalf — we don't have your audience list, and narrow scope is a feature.

## How is this different from Typeform, Google Forms, or SurveyMonkey?

Those tools assume a human builds the form in a UI, shares the link, then reads responses in a dashboard. HumanSurvey flips it: an AI writes the schema programmatically, and an AI consumes the results programmatically. The hosted form is intentionally minimal. If a product manager is going to eyeball responses by hand, reach for Typeform. If an AI is going to synthesize them and do the next thing, reach for HumanSurvey.

## Do I need to write code or JSON to create a survey?

No. You describe what you want to learn in plain language to your AI ("ask attendees to rate the session 1–5, what topics they want next, any one thing to change"). The AI generates the JSON schema and posts it via MCP or REST. You never see the schema unless you want to.

## How do the results come back to my AI?

Your agent calls the `get_results` MCP tool (or `GET /api/surveys/{id}/responses` over REST) and gets aggregated counts plus raw JSON responses. From there it can draft a retro, update roadmap issues, send a Slack summary, or do anything else — because the output is structured data, not a PDF.

## Are responses anonymous?

By default, yes. The respondent page does not collect names, emails, or IDs — only the answers to the questions you defined. If you want to tie a response to a person, include an explicit question for it (e.g., "Your email") in the schema.

## Can I close a survey after a deadline or a response cap?

Yes. Pass `expires_at` (ISO timestamp) and/or `max_responses` when creating the survey. Your agent can also close it anytime by calling `close_survey`. Once closed, the public page shows a closed state and rejects new submissions.

## Which AI tools / agent frameworks work with HumanSurvey?

Anything that speaks MCP — Claude Code, Claude Desktop, Cursor, Cline, and other MCP-compatible clients — can use the MCP server directly with one config block. Anything else (custom agents, scripts, backend jobs) can call the REST API with a bearer token.

## Can I customize the look of the hosted form?

Not today. The form is intentionally minimal and consistent across surveys. We're tracking completion-rate data first to see whether theming would actually move the needle — if it does, we'll add agent-facing theme presets, not an HTML/CSS plugin surface.

## What question types are supported?

`single_choice`, `multi_choice`, `text`, `scale`, and `matrix`, plus conditional `showIf` logic. The vocabulary is intentionally small so an AI can reliably generate valid schemas, rather than giving a human designer every possible knob.

## Is it free?

Open source, currently free to use for reasonable volumes. Long-term, billing will be tied to the owner email / wallet address captured at API key creation time. No surprise invoices — when pricing lands, it will be announced up front.

## Where do I point my AI for complete technical details?

The human docs are at /docs. Machine-readable references: /api/openapi.json (OpenAPI 3), /llms.txt (short AI-first overview), /llms-full.txt (full AI-readable index).
