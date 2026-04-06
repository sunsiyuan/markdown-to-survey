import type { ScaleResultsQuestion } from '@/lib/results'

type ScaleResultProps = {
  question: ScaleResultsQuestion
}

export function ScaleResult({ question }: ScaleResultProps) {
  const entries = Object.entries(question.stats.distribution)
  const maxCount = Math.max(...entries.map(([, count]) => count), 0)

  if (question.stats.count === 0) {
    return <p className="text-sm text-slate-500">No scale responses yet.</p>
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mean</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {question.stats.mean} / {question.max}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Median</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{question.stats.median}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex min-h-40 items-end gap-3">
          {entries.map(([value, count]) => {
            const height = maxCount === 0 ? 0 : Math.max((count / maxCount) * 100, count > 0 ? 12 : 0)

            return (
              <div key={value} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-xs font-medium text-slate-500">{count}</div>
                <div className="flex h-28 w-full items-end">
                  <div
                    className="w-full rounded-t-2xl bg-blue-600 transition-[height] duration-300"
                    style={{ height: `${height}%` }}
                    title={`${value}: ${count}`}
                  />
                </div>
                <div className="text-sm font-medium text-slate-700">{value}</div>
              </div>
            )
          })}
        </div>
        {(question.minLabel || question.maxLabel) ? (
          <div className="mt-4 flex items-start justify-between gap-4 text-sm text-slate-500">
            <span>{question.minLabel ?? ''}</span>
            <span className="text-right">{question.maxLabel ?? ''}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
