import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Highlighter, MousePointer2, Type } from 'lucide-react'
import { PDFDocument, rgb } from 'pdf-lib'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { downloadBlob, getFilenameWithoutExt, readFileAsArrayBuffer, uint8ToBlob } from '@/lib/file-utils'
import { useT } from '@/lib/i18n'

type PDFDocumentProxy = Awaited<ReturnType<typeof import('pdfjs-dist')['getDocument']>>['promise'] extends Promise<infer T> ? T : never
type Mode = 'text' | 'highlight'

type TextAnnotation = {
  id: string
  type: 'text'
  page: number
  x: number
  top: number
  width: number
  height: number
  text: string
  color: string
  fontSize: number
}

type HighlightAnnotation = {
  id: string
  type: 'highlight'
  page: number
  x: number
  top: number
  width: number
  height: number
  color: string
  opacity: number
}

type Annotation = TextAnnotation | HighlightAnnotation

type DragState = {
  x: number
  y: number
  currentX: number
  currentY: number
} | null

const COLORS = ['#111827', '#2563eb', '#dc2626', '#16a34a', '#facc15']
const HIGHLIGHT_COLORS = ['#facc15', '#fb923c', '#86efac', '#93c5fd', '#f0abfc']

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const value = parseInt(normalized, 16)
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  }
}

function makeTextImage(text: string, fontSize: number, color: string) {
  const measure = document.createElement('canvas')
  const measureCtx = measure.getContext('2d')!
  measureCtx.font = `600 ${fontSize}px Inter, Pretendard, system-ui, sans-serif`
  const width = Math.ceil(measureCtx.measureText(text).width + fontSize)
  const height = Math.ceil(fontSize * 1.6)

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(32, width)
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `600 ${fontSize}px Inter, Pretendard, system-ui, sans-serif`
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, fontSize / 2, height / 2)
  return canvas.toDataURL('image/png')
}

export default function PDFEditor() {
  const { t } = useT()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(18)
  const [textColor, setTextColor] = useState('#111827')
  const [highlightColor, setHighlightColor] = useState('#facc15')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [drag, setDrag] = useState<DragState>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const renderPage = useCallback(async (doc: PDFDocumentProxy, pageNum: number, sc: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderTaskRef.current?.cancel()
    renderTaskRef.current = null

    const page = await doc.getPage(pageNum)
    const viewport = page.getViewport({ scale: sc })
    setPageSize({ width: viewport.width / sc, height: viewport.height / sc })
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    const task = page.render({ canvasContext: ctx, viewport, canvas })
    renderTaskRef.current = task
    try {
      await task.promise
    } catch (e: unknown) {
      if ((e as { name?: string })?.name !== 'RenderingCancelledException') console.error(e)
    }
  }, [])

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, currentPage, scale)
  }, [pdfDoc, currentPage, scale, renderPage])

  const onFile = async (files: File[]) => {
    const next = files[0]
    if (!next) return
    setFile(next)
    setCurrentPage(1)
    setAnnotations([])

    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()
    const buf = await readFileAsArrayBuffer(next)
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise
    setTotalPages(doc.numPages)
    setPdfDoc(doc)
  }

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) * canvas.width) / rect.width,
      y: ((clientY - rect.top) * canvas.height) / rect.height,
    }
  }

  const addText = (clientX: number, clientY: number) => {
    const point = getCanvasPoint(clientX, clientY)
    const trimmed = text.trim()
    if (!point || !trimmed) return
    const image = makeTextImage(trimmed, fontSize, textColor)
    const temp = new Image()
    temp.onload = () => {
      setAnnotations((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'text',
          page: currentPage,
          x: point.x / scale,
          top: point.y / scale,
          width: temp.width / scale,
          height: temp.height / scale,
          text: trimmed,
          color: textColor,
          fontSize,
        },
      ])
    }
    temp.src = image
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pdfDoc) return
    const point = getCanvasPoint(e.clientX, e.clientY)
    if (!point) return
    if (mode === 'text') {
      addText(e.clientX, e.clientY)
      return
    }
    setDrag({ x: point.x, y: point.y, currentX: point.x, currentY: point.y })
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || mode !== 'highlight') return
    const point = getCanvasPoint(e.clientX, e.clientY)
    if (!point) return
    setDrag((prev) => prev ? { ...prev, currentX: point.x, currentY: point.y } : null)
  }

  const onPointerUp = () => {
    if (!drag || mode !== 'highlight') return
    const x = Math.min(drag.x, drag.currentX)
    const y = Math.min(drag.y, drag.currentY)
    const width = Math.abs(drag.currentX - drag.x)
    const height = Math.abs(drag.currentY - drag.y)
    setDrag(null)
    if (width < 8 || height < 8) return
    setAnnotations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'highlight',
        page: currentPage,
        x: x / scale,
        top: y / scale,
        width: width / scale,
        height: height / scale,
        color: highlightColor,
        opacity: 0.35,
      },
    ])
  }

  const removeAnnotation = (id: string) => setAnnotations((prev) => prev.filter((a) => a.id !== id))
  const clearPage = () => setAnnotations((prev) => prev.filter((a) => a.page !== currentPage))

  const save = async () => {
    if (!file || annotations.length === 0) return
    setLoading(true)
    setProgress(25)
    try {
      const buf = await readFileAsArrayBuffer(file)
      const doc = await PDFDocument.load(buf)
      const pages = doc.getPages()
      setProgress(55)

      for (const ann of annotations) {
        const page = pages[ann.page - 1]
        if (!page) continue
        const { height } = page.getSize()
        if (ann.type === 'highlight') {
          const color = hexToRgb(ann.color)
          page.drawRectangle({
            x: ann.x,
            y: height - ann.top - ann.height,
            width: ann.width,
            height: ann.height,
            color: rgb(color.r, color.g, color.b),
            opacity: ann.opacity,
            borderOpacity: 0,
          })
        } else {
          const png = makeTextImage(ann.text, ann.fontSize, ann.color)
          const pngBytes = new Uint8Array(await (await fetch(png)).arrayBuffer())
          const image = await doc.embedPng(pngBytes)
          page.drawImage(image, {
            x: ann.x,
            y: height - ann.top - ann.height,
            width: ann.width,
            height: ann.height,
          })
        }
      }

      setProgress(90)
      const bytes = await doc.save()
      downloadBlob(uint8ToBlob(bytes, 'application/pdf'), `${getFilenameWithoutExt(file.name)}_edited.pdf`)
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const pageAnnotations = annotations.filter((a) => a.page === currentPage)
  const dragBox = drag
    ? {
        left: Math.min(drag.x, drag.currentX),
        top: Math.min(drag.y, drag.currentY),
        width: Math.abs(drag.currentX - drag.x),
        height: Math.abs(drag.currentY - drag.y),
      }
    : null

  return (
    <div className="space-y-4">
      {!pdfDoc ? (
        <FileDropZone onFiles={onFile} />
      ) : (
        <>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMode('text')}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${mode === 'text' ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-slate-200 text-slate-500 hover:border-blue-300 dark:border-slate-700 dark:text-slate-400'}`}
              >
                <Type className="h-4 w-4" />
                {t('editor.mode.text')}
              </button>
              <button
                onClick={() => setMode('highlight')}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${mode === 'highlight' ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-slate-200 text-slate-500 hover:border-blue-300 dark:border-slate-700 dark:text-slate-400'}`}
              >
                <Highlighter className="h-4 w-4" />
                {t('editor.mode.highlight')}
              </button>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MousePointer2 className="h-3.5 w-3.5" />
                {mode === 'text' ? t('editor.hint.text') : t('editor.hint.highlight')}
              </span>
            </div>

            {mode === 'text' ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('editor.text.placeholder')}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <input
                  type="number"
                  min={10}
                  max={48}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  title={t('editor.fontSize')}
                />
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setTextColor(c)} className={`h-8 w-8 rounded-lg border-2 ${textColor === c ? 'border-blue-600' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button key={c} onClick={() => setHighlightColor(c)} className={`h-8 w-8 rounded-lg border-2 ${highlightColor === c ? 'border-blue-600' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="rounded-lg px-2 py-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800">
                {t('viewer.prevPage')}
              </button>
              <span>{t('viewer.page', currentPage, totalPages)}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="rounded-lg px-2 py-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800">
                {t('viewer.nextPage')}
              </button>
              <button onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))} className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">-</button>
              <span>{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale((s) => Math.min(2.4, +(s + 0.2).toFixed(1)))} className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">+</button>
            </div>
            <button onClick={clearPage} disabled={pageAnnotations.length === 0} className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20">
              {t('editor.clearPage')}
            </button>
          </div>

          <div ref={wrapperRef} className="relative overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">
            <div
              className="relative mx-auto"
              style={{ width: pageSize.width * scale || undefined, height: pageSize.height * scale || undefined }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <canvas ref={canvasRef} className="rounded shadow-lg" />
              {pageAnnotations.map((ann) => (
                <button
                  key={ann.id}
                  onDoubleClick={() => removeAnnotation(ann.id)}
                  className="absolute cursor-pointer border border-blue-500/40 text-left"
                  title={t('editor.doubleClickRemove')}
                  style={{
                    left: ann.x * scale,
                    top: ann.top * scale,
                    width: ann.width * scale,
                    height: ann.height * scale,
                    backgroundColor: ann.type === 'highlight' ? ann.color : 'transparent',
                    opacity: ann.type === 'highlight' ? ann.opacity : 1,
                    color: ann.type === 'text' ? ann.color : undefined,
                    fontSize: ann.type === 'text' ? ann.fontSize * scale : undefined,
                    fontWeight: 600,
                    lineHeight: ann.type === 'text' ? `${ann.height * scale}px` : undefined,
                    overflow: 'hidden',
                  }}
                >
                  {ann.type === 'text' ? ann.text : ''}
                </button>
              ))}
              {dragBox && (
                <div
                  className="pointer-events-none absolute border border-blue-600"
                  style={{ left: dragBox.left, top: dragBox.top, width: dragBox.width, height: dragBox.height, backgroundColor: highlightColor, opacity: 0.35 }}
                />
              )}
            </div>
          </div>

          {loading && <ProgressBar value={progress} label={t('editor.running')} />}

          <Button onClick={save} loading={loading} disabled={annotations.length === 0} size="lg" className="w-full justify-center">
            <Download className="h-4 w-4" />
            {t('editor.save', annotations.length)}
          </Button>
        </>
      )}
    </div>
  )
}
