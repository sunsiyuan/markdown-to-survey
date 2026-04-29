import { nanoid } from 'nanoid'

import { sql } from '@/lib/db'

export type CompletionWebhookPayload = {
  event_id: string
  survey_id: string
  status: 'closed'
  closed_reason: 'manual' | 'max_responses' | 'expired'
  response_count: number
  closed_at: string
}

export function fireWebhook(url: string, payload: CompletionWebhookPayload): void {
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error('Webhook delivery failed', url, err)
  })
}

// Atomically claim the completion-webhook fire slot for a survey and deliver if a
// webhook_url is set. Safe to call concurrently from multiple paths (manual close,
// max-responses, expired detection) — at most one delivery per survey.
//
// Stamps `completion_webhook_fired_at` even if no webhook_url is configured: the column
// models "fire opportunity consumed", not "delivery succeeded". A webhook_url added after
// the fact does not retroactively trigger.
//
// First concurrent caller wins the atomic claim; `reason` reflects the winning path,
// which may not be the chronologically "true" cause when multiple terminal conditions
// (manual + max + expired) arrive simultaneously. Acceptable: all three are "closed".
export async function tryFireCompletionWebhook(
  surveyId: string,
  reason: CompletionWebhookPayload['closed_reason'],
): Promise<void> {
  const rows = (await sql`
    UPDATE surveys
    SET completion_webhook_fired_at = now()
    WHERE id = ${surveyId} AND completion_webhook_fired_at IS NULL
    RETURNING webhook_url, response_count
  `) as Array<{ webhook_url: string | null; response_count: number }>

  const row = rows[0]
  if (!row?.webhook_url) return

  fireWebhook(row.webhook_url, {
    event_id: `evt_${nanoid(12)}`,
    survey_id: surveyId,
    status: 'closed',
    closed_reason: reason,
    response_count: row.response_count,
    closed_at: new Date().toISOString(),
  })
}
