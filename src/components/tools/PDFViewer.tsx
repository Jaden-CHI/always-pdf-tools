import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import { readFileAsArrayBuffer } from '@/lib/file-utils'
import { useT } from '@/lib/i18n'

type PDFDocumentProxy = Awaited<ReturnType<typeof import('pdfjs-dist')['getDocument']>>['promise'] extends Promise<infer T> ? T : never

export default function PDFViewer() {
  const { t } = useT()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null)

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [rendering, setRendering] = useState(false)
  const [fileName, setFileName] = useState('')

  const renderPage = useCallback(async (doc: PDFDocumentProxy, pageNum: number, sc: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }

    setRendering(true)
    try {
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: sc })
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      const task = page.render({ canvasContext: ctx, viewport, canvas })
      renderTaskRef.current = task
      await task.promise
    } catch (e: unknown) {
      if ((e as { name?: string })?.name !== 'RenderingCancelledException') console.error(e)
    } finally {
      setRendering(false)
    }
  }, [])

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, currentPage, scale)
  }, [pdfDoc, currentPage, scale, renderPage])

  const onFile = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setFileName(file.name)
    setCurrentPage(1)

    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString()

    const buf = await readFileAsArrayBuffer(file)
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise
    setTotalPages(doc.numPages)
    setPdfDoc(doc)
  }

  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1))
  const nextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1))
  const zoomIn = () => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)))
  const zoomOut = () => setScale((s) => Math.max(0.4, +(s - 0.2).toFixed(1)))

  const onPageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const v = parseInt((e.target as HTMLInputElement).value)
    if (!isNaN(v) && v >= 1 && v <= totalPages) setCurrentPage(v)
  }

  return (
    <div className="space-y-4">
      {!pdfDoc ? (
        <FileDropZone onFiles={onFile} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate flex-1">{fileName}</p>
            <button
              onClick={() => { setPdfDoc(null); setFileName('') }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
            >
              {t('app.back').replace('← ', '')}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                disabled={scale <= 0.4}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
                title={t('viewer.zoomOut')}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={scale >= 3}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
                title={t('viewer.zoomIn')}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevPage}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                <input
                  key={currentPage}
                  type="number"
                  defaultValue={currentPage}
                  min={1}
                  max={totalPages}
                  onKeyDown={onPageInput}
                  className="w-10 text-center px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs"
                />
                <span>/ {totalPages}</span>
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex justify-center p-4 min-h-[400px]">
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-slate-400">{t('viewer.loading')}</p>
              </div>
            )}
            <canvas ref={canvasRef} className="shadow-lg rounded" />
          </div>
        </>
      )}
    </div>
  )
}
