import { useState } from 'react'
import { Download } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { pdfToImages } from '@/lib/pdf-convert'
import { downloadBlob, formatFileSize } from '@/lib/file-utils'

export default function ConvertToImage() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onFile = (files: File[]) => setFile(files[0] ?? null)

  const convert = async () => {
    if (!file) return
    setLoading(true)
    setProgress(20)
    const results = await pdfToImages(file, format)
    setProgress(90)
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

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">이미지 형식</p>
        <div className="grid grid-cols-2 gap-2">
          {(['jpeg', 'png'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                format === f
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && <ProgressBar value={progress} label="변환 중... (페이지 수에 따라 시간이 걸릴 수 있습니다)" />}

      <Button onClick={convert} loading={loading} disabled={!file} size="lg" className="w-full justify-center">
        <Download className="w-4 h-4" />
        이미지로 변환하기
      </Button>
    </div>
  )
}
