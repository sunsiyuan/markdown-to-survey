import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

import { parseSurvey, type Question, type Survey } from '@mts/parser'

import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
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
  const resultId = nanoid(12)
  const questionCount = countQuestions(survey)

  const { error } = await supabase.from('surveys').insert({
    id,
    result_id: resultId,
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
      results_url: `/r/${resultId}`,
      question_count: questionCount,
    },
    { status: 201 },
  )
}

function countQuestions(survey: Survey) {
  return survey.sections.reduce(
    (total, section) =>
      total +
      section.questions.reduce(
        (sectionTotal, question) => sectionTotal + countQuestion(question),
        0,
      ),
    0,
  )
}

function countQuestion(question: Question): number {
  if (!question.subQuestions?.length) {
    return 1
  }

  return (
    1 +
    question.subQuestions.reduce(
      (total, subQuestion) => total + countQuestion(subQuestion),
      0,
    )
  )
}
