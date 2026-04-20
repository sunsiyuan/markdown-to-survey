const fits = [
  'You want feedback from your community, customers, attendees, or waitlist',
  'Responses can arrive over hours or days — async is fine',
  'The questions are known up front: ratings, choices, short text',
  'You want your AI to consume the results and do the next thing',
]

const skip = [
  '1-on-1 clarification with a single user (just chat)',
  'Long-form interviews or open-ended research transcripts',
  'Analytics dashboards for a human PM to browse',
  'Lead-gen forms meant for a marketing automation funnel',
]

export function WhenToUse() {
  return (
    <section id="fit" className="space-y-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
        When this fits
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface)] px-5 py-4 backdrop-blur-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Reach for it when
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-5 text-slate-700">
            {fits.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface)] px-5 py-4 backdrop-blur-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Use something else when
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-5 text-slate-600">
            {skip.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
