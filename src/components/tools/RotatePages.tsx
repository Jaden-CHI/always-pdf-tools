import { useState } from 'react'
import { Download, RotateCw } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { PDFDocument, degrees } from 'pdf-lib'
import { downloadBlob, formatFileSize, getFilenameWithoutExt, readFileAsArrayBuffer, uint8ToBlob } from '@/lib/file-utils'

const ANGLES = [90, 180, 270]

export default function RotatePages() {
  const [file, setFile] = useState<File | null>(null)
  const [angle, setAngle] = useState(90)
  const [target, setTarget] = useState<'all' | 'even' | 'odd'>('all')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onFile = (files: File[]) => setFile(files[0] ?? null)

  const rotate = async () => {
    if (!file) return
    setLoading(true)
    setProgress(30)
    try {
      const buf = await readFileAsArrayBuffer(file)
      const doc = await PDFDocument.load(buf)
      const pages = doc.getPages()
      pages.forEach((page, i) => {
        const idx = i + 1
        const shouldRotate =
          target === 'all' ||
          (target === 'even' && idx % 2 === 0) ||
          (target === 'odd' && idx % 2 !== 0)
        if (shouldRotate) {
          page.setRotation(degrees((page.getRotation().angle + angle) % 360))
        }
      })
      setProgress(80)
      const bytes = await doc.save()
      downloadBlob(
        uint8ToBlob(bytes, 'application/pdf'),
        `${getFilenameWithoutExt(file.name)}_rotated.pdf`
      )
    } finally {
      setLoading(false)
      setProgress(0)
    }
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
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">회전 각도</p>
        <div className="grid grid-cols-3 gap-2">
          {ANGLES.map((a) => (
            <button
              key={a}
              onClick={() => setAngle(a)}
              className={`flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                angle === a
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              {a}°
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">적용 대상</p>
        <div className="grid grid-cols-3 gap-2">
          {([['all', '전체'], ['odd', '홀수 페이지'], ['even', '짝수 페이지']] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTarget(v)}
              className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                target === v
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading && <ProgressBar value={progress} label="회전 중..." />}

      <Button onClick={rotate} loading={loading} disabled={!file} size="lg" className="w-full justify-center">
        <Download className="w-4 h-4" />
        회전 후 저장하기
      </Button>
    </div>
  )
}
