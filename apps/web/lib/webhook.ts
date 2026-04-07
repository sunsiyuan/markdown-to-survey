export type WebhookPayload = {
  survey_id: string
  status: 'closed'
  closed_reason: 'manual' | 'max_responses'
  response_count: number
  closed_at: string
}

export function fireWebhook(url: string, payload: WebhookPayload): void {
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error('Webhook delivery failed', url, err)
  })
}
