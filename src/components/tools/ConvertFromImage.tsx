import { useState } from 'react'
import { Trash2, Download } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { imagesToPDF } from '@/lib/pdf-convert'
import { downloadBlob, formatFileSize, generateId } from '@/lib/file-utils'
import type { PDFFile } from '@/types'

export default function ConvertFromImage() {
  const [files, setFiles] = useState<PDFFile[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const addFiles = (newFiles: File[]) => {
    const imgs = newFiles
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ id: generateId(), file: f, name: f.name, size: f.size }))
    setFiles((prev) => [...prev, ...imgs])
  }

  const remove = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const convert = async () => {
    if (files.length === 0) return
    setLoading(true)
    setProgress(30)
    const result = await imagesToPDF(files.map((f) => f.file))
    setProgress(100)
    if (result.success && result.blob) downloadBlob(result.blob, result.filename!)
    setLoading(false)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      <FileDropZone
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        onFiles={addFiles}
        label="이미지 파일을 드래그하거나 클릭해서 선택하세요"
        sublabel="JPG, PNG, WEBP 지원"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{f.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(f.size)}</p>
              </div>
              <button onClick={() => remove(f.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && <ProgressBar value={progress} label="PDF로 변환 중..." />}

      <Button onClick={convert} loading={loading} disabled={files.length === 0} size="lg" className="w-full justify-center">
        <Download className="w-4 h-4" />
        PDF로 변환하기 ({files.length}개)
      </Button>
    </div>
  )
}
