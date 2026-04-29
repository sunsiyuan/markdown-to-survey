import { sql } from '@/lib/db'
import { tryFireCompletionWebhook } from '@/lib/webhook'

export type SurveyLifecycle = {
  status?: string | null
  response_count?: number | null
  max_responses?: number | null
  expires_at?: string | null
}

export function getSurveyClosureReason(survey: SurveyLifecycle) {
  // Check specific causes BEFORE the generic 'closed' fallback. A survey may have
  // status='closed' because expiry passed or max_responses was hit — preserving the
  // specific cause matters for the public completion_reason and for 410 messaging.
  // Only fall back to 'closed' when no other cause is detectable (e.g. manual close
  // with no max/expiry configured).
  if (survey.expires_at && new Date(survey.expires_at) < new Date()) {
    return 'expired'
  }

  if (
    typeof survey.max_responses === 'number' &&
    typeof survey.response_count === 'number' &&
    survey.response_count >= survey.max_responses
  ) {
    return 'full'
  }

  if ((survey.status ?? 'open') === 'closed') {
    return 'closed'
  }

  return null
}

export function isSurveyClosed(survey: SurveyLifecycle) {
  return getSurveyClosureReason(survey) !== null
}

export type PublicCompletionReason = 'closed' | 'max_responses' | 'expired'

export function mapClosureReasonForPayload(
  reason: ReturnType<typeof getSurveyClosureReason>,
): PublicCompletionReason | null {
  if (reason === 'full') return 'max_responses'
  return reason
}

// Lazy expiry handling. If the survey has passed its expires_at and is still marked open,
// atomically transition it to closed and fire the completion webhook (idempotently).
// Returns the survey's effective status after handling — assign it back to keep local state in sync.
export async function ensureExpiredHandled(survey: {
  id: string
  status: string
  expires_at: string | null
}): Promise<string> {
  if (survey.status === 'closed') return survey.status
  if (!survey.expires_at) return survey.status
  if (new Date(survey.expires_at) > new Date()) return survey.status

  await sql`UPDATE surveys SET status = 'closed' WHERE id = ${survey.id} AND status = 'open'`
  await tryFireCompletionWebhook(survey.id, 'expired')
  return 'closed'
}
