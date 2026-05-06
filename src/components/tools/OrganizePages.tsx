import { useState, useRef } from 'react'
import { Download, Trash2, GripVertical } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { PDFDocument } from 'pdf-lib'
import { downloadBlob, formatFileSize, getFilenameWithoutExt, readFileAsArrayBuffer, uint8ToBlob } from '@/lib/file-utils'

interface PageItem {
  originalIndex: number
  label: string
}

export default function OrganizePages() {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const dragIndex = useRef<number | null>(null)

  const onFile = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    const buf = await readFileAsArrayBuffer(f)
    const doc = await PDFDocument.load(buf)
    const count = doc.getPageCount()
    setPages(Array.from({ length: count }, (_, i) => ({ originalIndex: i, label: `페이지 ${i + 1}` })))
  }

  const remove = (idx: number) => setPages((prev) => prev.filter((_, i) => i !== idx))

  const onDragStart = (idx: number) => { dragIndex.current = idx }

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === idx) return
    setPages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex.current!, 1)
      next.splice(idx, 0, moved)
      dragIndex.current = idx
      return next
    })
  }

  const onDragEnd = () => { dragIndex.current = null }

  const save = async () => {
    if (!file || pages.length === 0) return
    setLoading(true)
    setProgress(30)
    try {
      const buf = await readFileAsArrayBuffer(file)
      const src = await PDFDocument.load(buf)
      const doc = await PDFDocument.create()
      const indices = pages.map((p) => p.originalIndex)
      const copied = await doc.copyPages(src, indices)
      copied.forEach((p) => doc.addPage(p))
      setProgress(80)
      const bytes = await doc.save()
      downloadBlob(
        uint8ToBlob(bytes, 'application/pdf'),
        `${getFilenameWithoutExt(file.name)}_organized.pdf`
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
          <p className="text-xs text-slate-400">{formatFileSize(file.size)} · {pages.length}페이지</p>
        </div>
      )}

      {pages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            페이지 순서 조정 <span className="text-xs font-normal text-slate-400">(드래그로 순서 변경)</span>
          </p>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {pages.map((p, i) => (
              <div
                key={`${p.originalIndex}-${i}`}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{p.label}</span>
                <span className="text-xs text-slate-400 w-6 text-center">{i + 1}</span>
                <button
                  onClick={() => remove(i)}
                  className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">{pages.length}페이지 선택됨</p>
        </div>
      )}

      {loading && <ProgressBar value={progress} label="페이지 재구성 중..." />}

      <Button
        onClick={save}
        loading={loading}
        disabled={!file || pages.length === 0}
        size="lg"
        className="w-full justify-center"
      >
        <Download className="w-4 h-4" />
        재구성된 PDF 저장
      </Button>
    </div>
  )
}
