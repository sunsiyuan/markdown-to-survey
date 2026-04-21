'use client'

import { useState } from 'react'

type Tab = 'claudecode' | 'claudedesktop'

const CLAUDE_CODE_CMD = 'claude mcp add humansurvey -- npx -y humansurvey-mcp'

const CLAUDE_DESKTOP_JSON = `{
  "mcpServers": {
    "humansurvey": {
      "command": "npx",
      "args": ["-y", "humansurvey-mcp"]
    }
  }
}`

export function InstallPanel() {
  const [tab, setTab] = useState<Tab>('claudecode')
  const [copied, setCopied] = useState(false)

  const content = tab === 'claudecode' ? CLAUDE_CODE_CMD : CLAUDE_DESKTOP_JSON

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--code-surface)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab('claudecode')}
            className={`rounded-md px-3 py-1 font-mono text-[11px] transition ${
              tab === 'claudecode'
                ? 'bg-white/10 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Claude Code
          </button>
          <button
            type="button"
            onClick={() => setTab('claudedesktop')}
            className={`rounded-md px-3 py-1 font-mono text-[11px] transition ${
              tab === 'claudedesktop'
                ? 'bg-white/10 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Claude Desktop
          </button>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="font-mono text-[11px] text-slate-500 transition hover:text-slate-200"
        >
          {copied ? 'copied!' : 'copy'}
        </button>
      </div>

      <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-6 text-[var(--accent-fg)]">
        {content}
      </pre>

      {tab === 'claudedesktop' && (
        <p className="border-t border-white/10 px-5 py-3 font-mono text-[11px] text-slate-500">
          Add to{' '}
          <code className="text-slate-400">
            ~/Library/Application Support/Claude/claude_desktop_config.json
          </code>
        </p>
      )}

      <p className="border-t border-white/10 px-5 py-3 text-[12px] text-slate-500">
        No API key needed — the agent creates one on first run.
      </p>
    </div>
  )
}
