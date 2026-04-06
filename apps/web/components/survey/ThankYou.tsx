export function ThankYou() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-20">
      <div className="w-full rounded-3xl border border-blue-100 bg-white p-10 text-center shadow-[0_24px_80px_-40px_rgba(37,99,235,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Response received
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          Thank you for your response!
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Your answers have been submitted successfully.
        </p>
      </div>
    </div>
  )
}
