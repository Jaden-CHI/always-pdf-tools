import { useState, useRef } from 'react'
import { Copy, Download, ScanText } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { readFileAsArrayBuffer } from '@/lib/file-utils'

type Lang = 'kor' | 'eng' | 'kor+eng'

const LANGS: { value: Lang; label: string }[] = [
  { value: 'kor', label: '한국어' },
  { value: 'eng', label: '영어' },
  { value: 'kor+eng', label: '한국어 + 영어' },
]

export default function OCRTool() {
  const [file, setFile] = useState<File | null>(null)
  const [lang, setLang] = useState<Lang>('kor+eng')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const abortRef = useRef(false)

  const onFile = (files: File[]) => {
    setFile(files[0] ?? null)
    setResult('')
  }

  const run = async () => {
    if (!file) return
    setLoading(true)
    setProgress(0)
    setResult('')
    abortRef.current = false

    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(lang, 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
            setProgressLabel('텍스트 인식 중...')
          } else if (m.status === 'loading language traineddata') {
            setProgressLabel('언어 데이터 로딩 중...')
            setProgress(10)
          } else if (m.status === 'initializing api') {
            setProgressLabel('OCR 엔진 초기화 중...')
            setProgress(20)
          }
        },
      })

      let text = ''

      if (file.type === 'application/pdf') {
        // PDF → 이미지 변환 후 OCR
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url
        ).toString()
        const buf = await readFileAsArrayBuffer(file)
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise

        for (let i = 1; i <= pdf.numPages; i++) {
          if (abortRef.current) break
          setProgressLabel(`${i} / ${pdf.numPages} 페이지 처리 중...`)
          setProgress(Math.round((i / pdf.numPages) * 60))

          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 2 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')!
          await page.render({ canvasContext: ctx, viewport, canvas }).promise

          const { data } = await worker.recognize(canvas)
          text += `\n--- 페이지 ${i} ---\n${data.text}`
        }
      } else {
        setProgressLabel('이미지 인식 중...')
        const { data } = await worker.recognize(file)
        text = data.text
      }

      await worker.terminate()
      setResult(text.trim())
      setProgress(100)
      setProgressLabel('완료!')
    } catch (e) {
      setResult(`오류가 발생했습니다: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
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
        label="PDF 또는 이미지를 드래그하거나 클릭해서 선택하세요"
        sublabel="PDF, JPG, PNG, WEBP, BMP, TIFF 지원"
      />

      {file && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
          <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">인식 언어</p>
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
        텍스트 인식 시작
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">인식 결과</p>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? '복사됨!' : '복사'}
              </button>
              <button
                onClick={download}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                .txt 저장
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={result}
            rows={12}
            className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 resize-y font-mono leading-relaxed"
          />
          <p className="text-xs text-slate-400 text-right">{result.length.toLocaleString()}자</p>
        </div>
      )}
    </div>
  )
}
