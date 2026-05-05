import { useState } from 'react'
import { Download } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { compressPDF } from '@/lib/pdf-compress'
import { downloadBlob, formatFileSize } from '@/lib/file-utils'

const LEVELS = [
  { label: '낮음 (최대 압축)', value: 40 },
  { label: '보통 (권장)', value: 65 },
  { label: '높음 (고품질)', value: 85 },
]

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(65)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ original: number; compressed: number } | null>(null)

  const onFile = (files: File[]) => {
    setFile(files[0] ?? null)
    setResult(null)
  }

  const compress = async () => {
    if (!file) return
    setLoading(true)
    setProgress(40)
    const res = await compressPDF(file, quality)
    setProgress(100)
    if (res.success && res.blob) {
      setResult({ original: file.size, compressed: res.blob.size })
      downloadBlob(res.blob, res.filename!)
    }
    setLoading(false)
    setProgress(0)
  }

  const saved = result ? Math.round((1 - result.compressed / result.original) * 100) : 0

  return (
    <div className="space-y-6">
      <FileDropZone onFiles={onFile} />

      {file && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">압축 품질</p>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setQuality(l.value)}
              className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                quality === l.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">압축 완료!</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-slate-500">원본</p>
              <p className="font-medium text-slate-700 dark:text-slate-200">{formatFileSize(result.original)}</p>
            </div>
            <div>
              <p className="text-slate-500">압축 후</p>
              <p className="font-medium text-slate-700 dark:text-slate-200">{formatFileSize(result.compressed)}</p>
            </div>
            <div>
              <p className="text-slate-500">절감</p>
              <p className="font-bold text-green-600 dark:text-green-400">{saved}%</p>
            </div>
          </div>
        </div>
      )}

      {loading && <ProgressBar value={progress} label="압축 중..." />}

      <Button onClick={compress} loading={loading} disabled={!file} size="lg" className="w-full justify-center">
        <Download className="w-4 h-4" />
        PDF 압축하기
      </Button>
    </div>
  )
}
