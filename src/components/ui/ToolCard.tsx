import { type LucideIcon } from 'lucide-react'

interface ToolCardProps {
  icon: LucideIcon
  name: string
  description: string
  onClick: () => void
  color?: string
}

export default function ToolCard({
  icon: Icon,
  name,
  description,
  onClick,
  color = 'blue',
}: ToolCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all bg-white dark:bg-slate-900 text-left w-full group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] ?? colorMap.blue}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {name}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </button>
  )
}
