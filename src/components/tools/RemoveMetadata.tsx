import { useState } from 'react'
import { Download, ShieldCheck } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { PDFDocument } from 'pdf-lib'
import { downloadBlob, formatFileSize, getFilenameWithoutExt, readFileAsArrayBuffer, uint8ToBlob } from '@/lib/file-utils'

const FIELDS = ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer', 'CreationDate', 'ModificationDate']

export default function RemoveMetadata() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  const onFile = (files: File[]) => {
    setFile(files[0] ?? null)
    setDone(false)
  }

  const remove = async () => {
    if (!file) return
    setLoading(true)
    setProgress(40)
    try {
      const buf = await readFileAsArrayBuffer(file)
      const doc = await PDFDocument.load(buf)

      doc.setTitle('')
      doc.setAuthor('')
      doc.setSubject('')
      doc.setKeywords([])
      doc.setCreator('')
      doc.setProducer('')

      setProgress(80)
      const bytes = await doc.save()
      downloadBlob(
        uint8ToBlob(bytes, 'application/pdf'),
        `${getFilenameWithoutExt(file.name)}_clean.pdf`
      )
      setDone(true)
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

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">제거되는 메타데이터</p>
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((f) => (
            <span key={f} className="text-xs px-2 py-1 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              {f}
            </span>
          ))}
        </div>
      </div>

      {done && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">메타데이터가 제거된 PDF가 저장됐습니다.</p>
        </div>
      )}

      {loading && <ProgressBar value={progress} label="메타데이터 제거 중..." />}

      <Button onClick={remove} loading={loading} disabled={!file} size="lg" className="w-full justify-center">
        <Download className="w-4 h-4" />
        메타데이터 제거 후 저장
      </Button>
    </div>
  )
}
