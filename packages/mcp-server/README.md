# humansurvey-mcp

MCP server for [HumanSurvey](https://www.humansurvey.co) — let AI agents collect structured feedback from groups of people.

An agent describes a survey as JSON schema, HumanSurvey returns a shareable respondent URL, a group of humans answers at that URL, and the agent retrieves machine-usable aggregated results when ready. The agent owns the workflow; humans just fill in the data.

## Install

Add the server to your MCP client config (Claude Code, Claude Desktop, or any MCP client):

```json
{
  "mcpServers": {
    "survey": {
      "command": "npx",
      "args": ["-y", "humansurvey-mcp"],
      "env": { "HUMANSURVEY_API_KEY": "hs_sk_your_key_here" }
    }
  }
}
```

`HUMANSURVEY_API_KEY` is optional — if it is not set, call `create_key` first and the agent provisions its own key, no human setup required.

## Tools

| Tool | What it does |
|------|--------------|
| `create_key` | Create a HumanSurvey API key. Call this first when `HUMANSURVEY_API_KEY` is not set. |
| `create_survey` | Create a survey from a JSON schema; returns the respondent URL to share and the survey ID. |
| `get_results` | Fetch aggregated results for a survey — choice tallies, scale stats, recent text, and a per-tag breakdown. Supports incremental cursor reads for long-running surveys. |
| `list_surveys` | List surveys owned by the configured API key. |
| `close_survey` | Close an open survey so it stops collecting responses. |

## Surveys collect asynchronously

Responses arrive over minutes, hours, or days. An agent does not need to stay alive polling — set a `webhook_url` at create time to be woken on closure or a response threshold, or pass `since_response_id` to `get_results` to fetch only new responses on re-entry.

## Links

- Product & API docs: <https://www.humansurvey.co/docs>
- Agent-readable overview: <https://www.humansurvey.co/llms.txt>
- Source: <https://github.com/sunsiyuan/human-survey>

## License

MIT
