import { NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const { data, error } = await supabase
    .from('surveys')
    .select('id, title, description, schema, response_count, status, max_responses, expires_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as
    | { status?: string; max_responses?: number | null; expires_at?: string | null }
    | null

  if (!body) {
    return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
  }

  if (
    body.status !== undefined &&
    body.status !== 'open' &&
    body.status !== 'closed'
  ) {
    return NextResponse.json({ error: "status must be 'open' or 'closed'" }, { status: 400 })
  }

  if (
    body.max_responses !== undefined &&
    body.max_responses !== null &&
    (!Number.isInteger(body.max_responses) || body.max_responses <= 0)
  ) {
    return NextResponse.json(
      { error: 'max_responses must be a positive integer' },
      { status: 400 },
    )
  }

  if (
    body.expires_at !== undefined &&
    body.expires_at !== null &&
    Number.isNaN(Date.parse(body.expires_at))
  ) {
    return NextResponse.json(
      { error: 'expires_at must be a valid ISO date' },
      { status: 400 },
    )
  }

  const { data: existingSurvey, error: surveyError } = await supabase
    .from('surveys')
    .select('id, api_key_id')
    .eq('id', id)
    .maybeSingle()

  if (surveyError) {
    return NextResponse.json({ error: surveyError.message }, { status: 500 })
  }

  if (!existingSurvey) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  }

  if (existingSurvey.api_key_id !== auth.keyId) {
    return NextResponse.json({ error: 'You do not have access to this survey' }, { status: 403 })
  }

  const updates: {
    status?: string
    max_responses?: number | null
    expires_at?: string | null
  } = {}

  if (body.status !== undefined) {
    updates.status = body.status
  }

  if (body.max_responses !== undefined) {
    updates.max_responses = body.max_responses
  }

  if (body.expires_at !== undefined) {
    updates.expires_at = body.expires_at
  }

  const { data, error } = await supabase
    .from('surveys')
    .update(updates)
    .eq('id', id)
    .select('id, status, max_responses, expires_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
