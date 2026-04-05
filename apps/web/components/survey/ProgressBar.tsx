type ProgressBarProps = {
  percentage: number
}

export function ProgressBar({ percentage }: ProgressBarProps) {
  return (
    <div className="sticky top-0 z-20 h-2 w-full bg-slate-100">
      <div
        className="h-full bg-blue-600 transition-[width] duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
