'use client'

import type { Question } from '@mts/parser'

type AnswerValue = string | string[] | undefined

type QuestionCardProps = {
  question: Question
  value: AnswerValue
  optionTexts: Record<string, string>
  onChange: (value: string | string[]) => void
  onOptionTextChange: (optionId: string, value: string) => void
}

export function QuestionCard({
  question,
  value,
  optionTexts,
  onChange,
  onOptionTextChange,
}: QuestionCardProps) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : []

  if (question.type === 'text') {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <QuestionHeader question={question} />
        <textarea
          className="mt-5 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          placeholder="Type your answer here..."
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }

  if (question.type === 'matrix') {
    const matrixOptions = question.columns?.[0]?.options ?? []
    const matrixSelections = parseMatrixSelections(selectedValues)

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <QuestionHeader question={question} />
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900">Item</th>
                {matrixOptions.map((option) => (
                  <th
                    key={option.id}
                    className="px-4 py-3 text-center font-semibold text-slate-900"
                  >
                    {option.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(question.rows ?? []).map((row) => (
                <tr key={row.id} className="border-t border-slate-200">
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-900">{row.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {question.columns?.[0] ? row.cells[question.columns[0].id] : ''}
                    </p>
                  </td>
                  {matrixOptions.map((option) => {
                    const checked = matrixSelections[row.id] === option.id

                    return (
                      <td key={option.id} className="px-4 py-4 text-center">
                        <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full bg-blue-50 transition hover:bg-blue-100">
                          <input
                            type="radio"
                            className="h-4 w-4 accent-blue-600"
                            name={`${question.id}-${row.id}`}
                            checked={checked}
                            onChange={() =>
                              onChange(
                                buildMatrixSelections(selectedValues, row.id, option.id),
                              )
                            }
                          />
                        </label>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const isMultiChoice = question.type === 'multi_choice'

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <QuestionHeader question={question} />
      <div className="mt-5 space-y-3">
        {(question.options ?? []).map((option) => {
          const selected = selectedValues.some(
            (entry) => decodeChoiceValue(entry).optionId === option.id,
          )
          const selectedValue = selectedValues.find(
            (entry) => decodeChoiceValue(entry).optionId === option.id,
          )
          const textValue = optionTexts[option.id] ?? decodeChoiceValue(selectedValue).text

          return (
            <label
              key={option.id}
              className={`block rounded-2xl border px-4 py-4 transition ${
                selected
                  ? 'border-blue-200 bg-blue-50 shadow-[0_12px_24px_-20px_rgba(37,99,235,0.9)]'
                  : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
              }`}
            >
              <div className="flex min-h-11 items-center gap-3">
                <input
                  type={isMultiChoice ? 'checkbox' : 'radio'}
                  name={question.id}
                  className="h-4 w-4 shrink-0 accent-blue-600"
                  checked={selected}
                  onChange={() =>
                    onChange(
                      updateChoiceValue({
                        value,
                        optionId: option.id,
                        isMultiChoice,
                        checked: !selected,
                        textValue,
                      }),
                    )
                  }
                />
                <span className="text-base leading-7 text-slate-900">{option.label}</span>
              </div>
              {option.hasTextInput && selected ? (
                <input
                  className="mt-3 min-h-11 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Please specify"
                  value={textValue}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    onOptionTextChange(option.id, nextValue)
                    onChange(
                      updateChoiceValue({
                        value,
                        optionId: option.id,
                        isMultiChoice,
                        checked: true,
                        textValue: nextValue,
                      }),
                    )
                  }}
                />
              ) : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}

function QuestionHeader({ question }: { question: Question }) {
  return (
    <div>
      <h2 className="text-lg font-semibold leading-8 text-slate-900">
        {question.label}
        {question.required ? <span className="ml-2 text-sm text-blue-600">*</span> : null}
      </h2>
      {question.description ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{question.description}</p>
      ) : null}
    </div>
  )
}

function updateChoiceValue({
  value,
  optionId,
  isMultiChoice,
  checked,
  textValue,
}: {
  value: AnswerValue
  optionId: string
  isMultiChoice: boolean
  checked: boolean
  textValue: string
}) {
  const encoded = encodeChoiceValue(optionId, textValue)

  if (!isMultiChoice) {
    return checked ? encoded : ''
  }

  const current = Array.isArray(value) ? value : []
  const filtered = current.filter((entry) => decodeChoiceValue(entry).optionId !== optionId)

  return checked ? [...filtered, encoded] : filtered
}

function encodeChoiceValue(optionId: string, textValue: string) {
  return textValue ? `${optionId}::${textValue}` : optionId
}

function decodeChoiceValue(value?: string) {
  if (!value) {
    return { optionId: '', text: '' }
  }

  const [optionId, ...textParts] = value.split('::')

  return {
    optionId,
    text: textParts.join('::'),
  }
}

function parseMatrixSelections(values: string[]) {
  return values.reduce<Record<string, string>>((accumulator, entry) => {
    const [rowId, optionId] = entry.split(':')
    if (rowId && optionId) {
      accumulator[rowId] = optionId
    }
    return accumulator
  }, {})
}

function buildMatrixSelections(values: string[], rowId: string, optionId: string) {
  const nextSelections = values.filter((entry) => !entry.startsWith(`${rowId}:`))
  nextSelections.push(`${rowId}:${optionId}`)
  return nextSelections
}
