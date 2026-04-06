import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

import {
  buildSurveyFromInput,
  parseSurvey,
  SurveyInputValidationError,
  type Survey,
  type SurveyInput,
} from '@mts/parser'

import { requireAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  const body = (await request.json().catch(() => null)) as
    | { markdown?: string; schema?: SurveyInput }
    | null
  const markdown = body?.markdown
  const schemaInput = body?.schema

  if (!markdown && !schemaInput) {
    return NextResponse.json(
      { error: 'Provide either markdown or schema' },
      { status: 400 },
    )
  }

  if (markdown && schemaInput) {
    return NextResponse.json(
      { error: 'Provide either markdown or schema, not both' },
      { status: 400 },
    )
  }

  let survey: Survey

  try {
    survey = schemaInput ? buildSurveyFromInput(schemaInput) : parseSurvey(markdown!)
  } catch (error) {
    if (error instanceof SurveyInputValidationError) {
      return NextResponse.json(
        { error: 'Invalid schema', errors: error.errors },
        { status: 400 },
      )
    }

    const message = error instanceof Error ? error.message : 'Unknown parser error'
    return NextResponse.json(
      { error: markdown ? `Failed to parse markdown: ${message}` : message },
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
    markdown: markdown ?? JSON.stringify(schemaInput),
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
