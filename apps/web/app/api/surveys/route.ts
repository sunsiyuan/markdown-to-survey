import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

import { parseSurvey, type Survey } from '@mts/parser'

import { requireAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  const body = (await request.json().catch(() => null)) as { markdown?: string } | null
  const markdown = body?.markdown

  if (!markdown) {
    return NextResponse.json({ error: 'Markdown is required' }, { status: 400 })
  }

  let survey: Survey

  try {
    survey = parseSurvey(markdown)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parser error'
    return NextResponse.json(
      { error: `Failed to parse markdown: ${message}` },
      { status: 400 },
    )
  }

  const id = nanoid(12)
  const questionCount = countQuestions(survey)

  const { error } = await supabase.from('surveys').insert({
    id,
    result_id: null,
    api_key_id: auth.keyId,
    title: survey.title,
    description: survey.description ?? null,
    schema: survey,
    markdown,
    response_count: 0,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      survey_url: `/s/${id}`,
      question_count: questionCount,
    },
    { status: 201 },
  )
}

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  const { data, error } = await supabase
    .from('surveys')
    .select('id, title, response_count, created_at')
    .eq('api_key_id', auth.keyId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    (data ?? []).map((survey) => ({
      ...survey,
      status: 'open',
    })),
  )
}

function countQuestions(survey: Survey) {
  return survey.sections.reduce(
    (total, section) => total + section.questions.length,
    0,
  )
}
