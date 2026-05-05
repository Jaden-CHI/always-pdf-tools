import { useState } from 'react'
import { Download } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { splitPDF } from '@/lib/pdf-split'
import { downloadBlob, formatFileSize } from '@/lib/file-utils'
import type { SplitOption } from '@/types'

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<SplitOption['mode']>('every')
  const [everyN, setEveryN] = useState(1)
  const [ranges, setRanges] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onFile = (files: File[]) => setFile(files[0] ?? null)

  const split = async () => {
    if (!file) return
    setLoading(true)
    setProgress(30)
    const results = await splitPDF(file, { mode, everyN, ranges })
    setProgress(80)
    results.forEach((r) => {
      if (r.success && r.blob) downloadBlob(r.blob, r.filename!)
    })
    setProgress(100)
    setLoading(false)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      <FileDropZone onFiles={onFile} />

      {file && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">분할 방식</p>
        <div className="grid grid-cols-3 gap-2">
          {(['every', 'range'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                mode === m
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
            >
              {m === 'every' ? '페이지마다' : '범위 지정'}
            </button>
          ))}
        </div>

        {mode === 'every' && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">매</p>
            <input
              type="number"
              min={1}
              value={everyN}
              onChange={(e) => setEveryN(Number(e.target.value))}
              className="w-20 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
            <p className="text-sm text-slate-600 dark:text-slate-400">페이지마다 분할</p>
          </div>
        )}

        {mode === 'range' && (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">예: 1-3, 4-6, 7</p>
            <input
              type="text"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="1-3, 4-6, 7"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>
        )}
      </div>

      {loading && <ProgressBar value={progress} label="분할 중..." />}

      <Button onClick={split} loading={loading} disabled={!file} size="lg" className="w-full justify-center">
        <Download className="w-4 h-4" />
        PDF 분할하기
      </Button>
    </div>
  )
}
