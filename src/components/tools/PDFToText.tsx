import { useState } from 'react'
import { Copy, Download, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import FileDropZone from '@/components/ui/FileDropZone'
import ProgressBar from '@/components/ui/ProgressBar'
import { downloadBlob, formatFileSize, getFilenameWithoutExt, readFileAsArrayBuffer } from '@/lib/file-utils'
import { useT } from '@/lib/i18n'

type MaybeTextItem = { str?: unknown }

export default function PDFToText() {
  const { t } = useT()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  const onFiles = (files: File[]) => {
    setFile(files[0] ?? null)
    setResult('')
  }

  const extract = async () => {
    if (!file) return
    setLoading(true)
    setProgress(5)
    setResult('')

    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()
      const bytes = await readFileAsArrayBuffer(file)
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise
      const pages: string[] = []

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        const text = content.items
          .map((item) => {
            const value = (item as MaybeTextItem).str
            return typeof value === 'string' ? value : ''
          })
          .filter(Boolean)
          .join(' ')
        pages.push(`${t('pdfToText.page', pageNumber)}\n${text}`)
        setProgress(Math.round((pageNumber / pdf.numPages) * 90))
      }

      setResult(pages.join('\n\n').trim())
      setProgress(100)
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveText = () => {
    if (!file) return
    downloadBlob(
      new Blob([result], { type: 'text/plain;charset=utf-8' }),
      `${getFilenameWithoutExt(file.name)}.txt`,
    )
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

      {loading && <ProgressBar value={progress} label={t('pdfToText.running')} />}

      <Button onClick={extract} loading={loading} disabled={!file} size="lg" className="w-full justify-center">
        <FileText className="h-4 w-4" />
        {t('pdfToText.run')}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('pdfToText.result')}</p>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={saveText}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" />
                {t('common.download')}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={result}
            rows={14}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      )}
    </div>
  )
}
