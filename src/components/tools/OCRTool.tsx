import { useState, useRef } from 'react'
import { Copy, Download, ScanText } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { readFileAsArrayBuffer } from '@/lib/file-utils'
import { useT } from '@/lib/i18n'

type Lang = 'kor' | 'eng' | 'kor+eng'

export default function OCRTool() {
  const { t } = useT()
  const [file, setFile] = useState<File | null>(null)
  const [lang, setLang] = useState<Lang>('kor+eng')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const abortRef = useRef(false)

  const LANGS: { value: Lang; label: string }[] = [
    { value: 'kor', label: t('ocr.lang.ko') },
    { value: 'eng', label: t('ocr.lang.en') },
    { value: 'kor+eng', label: t('ocr.lang.koEn') },
  ]

  const onFile = (files: File[]) => {
    setFile(files[0] ?? null)
    setResult('')
  }

  const run = async () => {
    if (!file) return
    setLoading(true)
    setProgress(0)
    setProgressLabel(t('ocr.status.loading'))
    setResult('')
    abortRef.current = false

    try {
      const { createWorker } = await import('tesseract.js')
      const workerPath = chrome.runtime.getURL('tesseract-worker.min.js')
      const corePath = chrome.runtime.getURL('tesseract-core-relaxedsimd-lstm.wasm.js')
      const worker = await createWorker(lang, 1, {
        workerPath,
        workerBlobURL: false,
        corePath,
        cacheMethod: 'none',
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
            setProgressLabel(t('ocr.status.recognizing'))
          } else if (m.status === 'loading language traineddata') {
            setProgressLabel(t('ocr.status.langData'))
            setProgress(10)
          } else if (m.status === 'initializing api') {
            setProgressLabel(t('ocr.status.init'))
            setProgress(20)
          }
        },
      })

      let text = ''

      if (file.type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url
        ).toString()
        const buf = await readFileAsArrayBuffer(file)
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise

        for (let i = 1; i <= pdf.numPages; i++) {
          if (abortRef.current) break
          setProgressLabel(t('ocr.status.page', i, pdf.numPages))
          setProgress(Math.round((i / pdf.numPages) * 60))

          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 2 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')!
          await page.render({ canvasContext: ctx, viewport, canvas }).promise

          const { data } = await worker.recognize(canvas)
          text += `\n${t('ocr.page', i)}\n${data.text}`
        }
      } else {
        setProgressLabel(t('ocr.status.imgRecognizing'))
        const { data } = await worker.recognize(file)
        text = data.text
      }

      await worker.terminate()
      setResult(text.trim())
      setProgress(100)
      setProgressLabel(t('ocr.status.done'))
    } catch (e) {
      setResult(`${t('common.error')}: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadTxt = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name ?? 'ocr'}_text.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const accept = '.pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff'

  return (
    <div className="space-y-6">
      <FileDropZone
        accept={accept}
        onFiles={onFile}
        label={t('dropzone.imgLabel')}
        sublabel={t('dropzone.imgSublabel')}
      />

      {file && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
          <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('ocr.lang')}</p>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLang(l.value)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                lang === l.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <ProgressBar value={progress} label={progressLabel} />}

      <Button onClick={run} loading={loading} disabled={!file} size="lg" className="w-full justify-center">
        <ScanText className="w-4 h-4" />
        {t('ocr.run')}
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('ocr.result')}</p>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={downloadTxt}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {t('ocr.saveTxt')}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={result}
            rows={12}
            className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 resize-y font-mono leading-relaxed"
          />
          <p className="text-xs text-slate-400 text-right">{result.length.toLocaleString()} {t('ocr.chars')}</p>
        </div>
      )}
    </div>
  )
}
