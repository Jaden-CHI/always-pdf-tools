import { useState } from 'react'
import { Crop } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import Button from '@/components/ui/Button'
import FileDropZone from '@/components/ui/FileDropZone'
import ProgressBar from '@/components/ui/ProgressBar'
import { downloadBlob, formatFileSize, getFilenameWithoutExt, readFileAsArrayBuffer, uint8ToBlob } from '@/lib/file-utils'
import { useT } from '@/lib/i18n'

export default function CropPDF() {
  const { t } = useT()
  const [file, setFile] = useState<File | null>(null)
  const [margin, setMargin] = useState(24)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onFiles = (files: File[]) => setFile(files[0] ?? null)

  const crop = async () => {
    if (!file) return
    setLoading(true)
    setProgress(20)

    try {
      const bytes = await readFileAsArrayBuffer(file)
      const pdf = await PDFDocument.load(bytes)

      pdf.getPages().forEach((page) => {
        const { width, height } = page.getSize()
        const safeMargin = Math.min(margin, Math.floor(Math.min(width, height) / 3))
        page.setCropBox(safeMargin, safeMargin, width - safeMargin * 2, height - safeMargin * 2)
      })

      setProgress(80)
      const output = await pdf.save()
      downloadBlob(uint8ToBlob(output, 'application/pdf'), `${getFilenameWithoutExt(file.name)}_cropped.pdf`)
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <FileDropZone onFiles={onFiles} />

      {file && (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
        </div>
      )}

      <label className="block space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('crop.margin')}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">{margin} pt</span>
        </div>
        <input
          type="range"
          min={0}
          max={120}
          value={margin}
          onChange={(e) => setMargin(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{t('crop.notice')}</p>
      </label>

      {loading && <ProgressBar value={progress} label={t('crop.running')} />}

      <Button onClick={crop} loading={loading} disabled={!file} size="lg" className="w-full justify-center">
        <Crop className="h-4 w-4" />
        {t('crop.run')}
      </Button>
    </div>
  )
}
