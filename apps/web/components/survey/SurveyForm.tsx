'use client'

import { useEffect, useState } from 'react'

import type { Question, Survey } from '@mts/parser'

import { ProgressBar } from './ProgressBar'
import { QuestionCard } from './QuestionCard'
import { ThankYou } from './ThankYou'

type SurveyFormProps = {
  surveyId: string
  survey: Survey
}

type AnswerMap = Record<string, string | string[]>

type OptionTextMap = Record<string, Record<string, string>>

export function SurveyForm({ surveyId, survey }: SurveyFormProps) {
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [optionTexts, setOptionTexts] = useState<OptionTextMap>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questions = survey.sections.flatMap((section) => section.questions)

  useEffect(() => {
    const saved = window.localStorage.getItem(`mts_draft_${surveyId}`)

    if (!saved) {
      return
    }

    try {
      const parsed = JSON.parse(saved) as { answers?: AnswerMap; optionTexts?: OptionTextMap }
      setAnswers(parsed.answers ?? {})
      setOptionTexts(parsed.optionTexts ?? {})
    } catch {
      window.localStorage.removeItem(`mts_draft_${surveyId}`)
    }
  }, [surveyId])

  useEffect(() => {
    window.localStorage.setItem(
      `mts_draft_${surveyId}`,
      JSON.stringify({ answers, optionTexts }),
    )
  }, [answers, optionTexts, surveyId])

  const answeredQuestions = questions.filter((question) =>
    isQuestionAnswered(question, answers[question.id]),
  ).length
  const progress =
    questions.length === 0 ? 0 : Math.round((answeredQuestions / questions.length) * 100)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      window.localStorage.removeItem(`mts_draft_${surveyId}`)
      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return <ThankYou />
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <ProgressBar percentage={progress} />
      <form className="mx-auto w-full max-w-3xl px-4 pb-12 pt-8 sm:px-6" onSubmit={handleSubmit}>
        <header className="rounded-[2rem] bg-white px-6 py-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.3)] sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Interactive survey
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {survey.title}
          </h1>
          {survey.description ? (
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {survey.description}
            </p>
          ) : null}
          <p className="mt-5 text-sm text-slate-500">
            {answeredQuestions} of {questions.length} questions answered
          </p>
        </header>

        <div className="mt-8 space-y-6">
          {survey.sections.map((section) => (
            <section
              key={section.id}
              className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] sm:px-6"
            >
              {section.title ? (
                <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
              ) : null}
              {section.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-500">{section.description}</p>
              ) : null}
              <div className="mt-5 space-y-5">
                {section.questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    value={answers[question.id]}
                    optionTexts={optionTexts[question.id] ?? {}}
                    onChange={(value) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: value,
                      }))
                    }
                    onOptionTextChange={(optionId, value) =>
                      setOptionTexts((current) => ({
                        ...current,
                        [question.id]: {
                          ...(current[question.id] ?? {}),
                          [optionId]: value,
                        },
                      }))
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-[2rem] bg-white px-6 py-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)]">
          <p className="text-sm text-slate-500">Your progress is saved automatically.</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? 'Submitting...' : 'Submit response'}
          </button>
        </div>
      </form>
    </div>
  )
}

function isQuestionAnswered(question: Question, value: string | string[] | undefined) {
  if (question.type === 'text') {
    return typeof value === 'string' && value.trim().length > 0
  }

  if (question.type === 'matrix') {
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.length === (question.rows?.length ?? 0)
    )
  }

  if (question.type === 'multi_choice') {
    return Array.isArray(value) && value.length > 0
  }

  return typeof value === 'string' && value.length > 0
}
