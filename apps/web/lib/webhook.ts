import { nanoid } from 'nanoid'

import { sql } from '@/lib/db'

export type CompletionWebhookPayload = {
  event_id: string
  event: 'survey_closed'
  survey_id: string
  status: 'closed'
  closed_reason: 'manual' | 'max_responses' | 'expired'
  response_count: number
  closed_at: string
}

export type ThresholdWebhookPayload = {
  event_id: string
  event: 'threshold_reached'
  survey_id: string
  status: 'open'
  response_count: number
  threshold: number
  fired_at: string
}

export type WebhookPayload = CompletionWebhookPayload | ThresholdWebhookPayload

export function fireWebhook(url: string, payload: WebhookPayload): void {
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
    event: 'survey_closed',
    survey_id: surveyId,
    status: 'closed',
    closed_reason: reason,
    response_count: row.response_count,
    closed_at: new Date().toISOString(),
  })
}

// Atomically claim the threshold-webhook fire slot. Same race-proof pattern as the
// completion variant, with its own column. Survey stays open after firing — this is
// a "you have enough signal" event, not a terminal one.
//
// Safe to call unconditionally after every response insert: the WHERE clause gates
// on the persisted response_count (set by the after-insert trigger), so two concurrent
// inserts that each hold a stale snapshot still both attempt the UPDATE and Postgres
// row-locks settle on the actual current count. No-op if no webhook_url, no
// notify_at_responses, count not yet at threshold, or already fired.
export async function tryFireThresholdWebhook(surveyId: string): Promise<void> {
  const rows = (await sql`
    UPDATE surveys
    SET threshold_webhook_fired_at = now()
    WHERE id = ${surveyId}
      AND threshold_webhook_fired_at IS NULL
      AND notify_at_responses IS NOT NULL
      AND response_count >= notify_at_responses
      AND status = 'open'
    RETURNING webhook_url, response_count, notify_at_responses
  `) as Array<{
    webhook_url: string | null
    response_count: number
    notify_at_responses: number | null
  }>

  const row = rows[0]
  if (!row?.webhook_url || row.notify_at_responses == null) return

  fireWebhook(row.webhook_url, {
    event_id: `evt_${nanoid(12)}`,
    event: 'threshold_reached',
    survey_id: surveyId,
    status: 'open',
    response_count: row.response_count,
    threshold: row.notify_at_responses,
    fired_at: new Date().toISOString(),
  })
}

// Atomically transition a survey to 'closed' iff the persisted response_count has
// reached max_responses. Race-proof against concurrent inserts (which all see stale
// pre-insert snapshots) by gating on the DB-current count rather than caller-computed
// newCount. Returns true iff this call performed the transition.
export async function tryCloseByMaxResponses(surveyId: string): Promise<boolean> {
  const rows = (await sql`
    UPDATE surveys
    SET status = 'closed'
    WHERE id = ${surveyId}
      AND status = 'open'
      AND max_responses IS NOT NULL
      AND response_count >= max_responses
    RETURNING id
  `) as Array<{ id: string }>
  return rows.length > 0
}
