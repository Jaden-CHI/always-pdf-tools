interface ProgressBarProps {
  value: number
  label?: string
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className="w-full space-y-1">
      {label && <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <p className="text-xs text-right text-slate-400">{Math.round(value)}%</p>
    </div>
  )
}
