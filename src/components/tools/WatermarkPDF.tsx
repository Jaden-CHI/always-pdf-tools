import { useState } from 'react'
import { Download } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import { downloadBlob, formatFileSize, getFilenameWithoutExt, readFileAsArrayBuffer, uint8ToBlob } from '@/lib/file-utils'

export default function WatermarkPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(30)
  const [fontSize, setFontSize] = useState(48)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onFile = (files: File[]) => setFile(files[0] ?? null)

  const apply = async () => {
    if (!file || !text.trim()) return
    setLoading(true)
    setProgress(30)
    try {
      const buf = await readFileAsArrayBuffer(file)
      const doc = await PDFDocument.load(buf)
      const font = await doc.embedFont(StandardFonts.HelveticaBold)
      const pages = doc.getPages()

      for (const page of pages) {
        const { width, height } = page.getSize()
        const textWidth = font.widthOfTextAtSize(text, fontSize)
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacity / 100,
          rotate: degrees(-45),
        })
      }

      setProgress(80)
      const bytes = await doc.save()
      downloadBlob(
        uint8ToBlob(bytes, 'application/pdf'),
        `${getFilenameWithoutExt(file.name)}_watermarked.pdf`
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

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">워터마크 텍스트</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            투명도: {opacity}%
          </label>
          <input
            type="range"
            min={10}
            max={80}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            글자 크기: {fontSize}px
          </label>
          <input
            type="range"
            min={24}
            max={96}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
      </div>

      {loading && <ProgressBar value={progress} label="워터마크 적용 중..." />}

      <Button onClick={apply} loading={loading} disabled={!file || !text.trim()} size="lg" className="w-full justify-center">
        <Download className="w-4 h-4" />
        워터마크 적용하기
      </Button>
    </div>
  )
}
