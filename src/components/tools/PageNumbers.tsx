import { useState } from 'react'
import { Hash } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import Button from '@/components/ui/Button'
import FileDropZone from '@/components/ui/FileDropZone'
import ProgressBar from '@/components/ui/ProgressBar'
import { downloadBlob, formatFileSize, getFilenameWithoutExt, readFileAsArrayBuffer, uint8ToBlob } from '@/lib/file-utils'
import { useT } from '@/lib/i18n'

type Position = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center'

const POSITIONS: { value: Position; labelKey: 'pageNumbers.pos.bottom-center' | 'pageNumbers.pos.bottom-right' | 'pageNumbers.pos.bottom-left' | 'pageNumbers.pos.top-center' }[] = [
  { value: 'bottom-center', labelKey: 'pageNumbers.pos.bottom-center' },
  { value: 'bottom-right', labelKey: 'pageNumbers.pos.bottom-right' },
  { value: 'bottom-left', labelKey: 'pageNumbers.pos.bottom-left' },
  { value: 'top-center', labelKey: 'pageNumbers.pos.top-center' },
]

export default function PageNumbers() {
  const { t } = useT()
  const [file, setFile] = useState<File | null>(null)
  const [position, setPosition] = useState<Position>('bottom-center')
  const [startNumber, setStartNumber] = useState(1)
  const [fontSize, setFontSize] = useState(12)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onFiles = (files: File[]) => setFile(files[0] ?? null)

  const addNumbers = async () => {
    if (!file) return
    setLoading(true)
    setProgress(20)

    try {
      const bytes = await readFileAsArrayBuffer(file)
      const pdf = await PDFDocument.load(bytes)
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      const pages = pdf.getPages()

      pages.forEach((page, index) => {
        const { width, height } = page.getSize()
        const text = String(startNumber + index)
        const textWidth = font.widthOfTextAtSize(text, fontSize)
        const margin = 28
        const x =
          position === 'bottom-left'
            ? margin
            : position === 'bottom-right'
              ? width - margin - textWidth
              : (width - textWidth) / 2
        const y = position === 'top-center' ? height - margin : margin

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.28, 0.33, 0.42),
        })
      })

      setProgress(80)
      const output = await pdf.save()
      downloadBlob(uint8ToBlob(output, 'application/pdf'), `${getFilenameWithoutExt(file.name)}_numbered.pdf`)
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

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('pageNumbers.position')}</span>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {POSITIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('pageNumbers.start')}</span>
          <input
            type="number"
            min={1}
            value={startNumber}
            onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value) || 1))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('pageNumbers.fontSize')}</span>
          <input
            type="number"
            min={8}
            max={36}
            value={fontSize}
            onChange={(e) => setFontSize(Math.min(36, Math.max(8, Number(e.target.value) || 12)))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </label>
      </div>

      {loading && <ProgressBar value={progress} label={t('pageNumbers.running')} />}

      <Button onClick={addNumbers} loading={loading} disabled={!file} size="lg" className="w-full justify-center">
        <Hash className="h-4 w-4" />
        {t('pageNumbers.run')}
      </Button>
    </div>
  )
}
