import { useRef, useState, useEffect } from 'react'
import { Download, Trash2 } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { PDFDocument } from 'pdf-lib'
import { downloadBlob, formatFileSize, getFilenameWithoutExt, readFileAsArrayBuffer, uint8ToBlob } from '@/lib/file-utils'

export default function SignPDF() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [page, setPage] = useState(1)
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'bottom-center'>('bottom-right')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setDrawing(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const endDraw = () => setDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const applySign = async () => {
    if (!file || !hasSignature) return
    setLoading(true)
    setProgress(30)
    try {
      const canvas = canvasRef.current!
      const sigDataUrl = canvas.toDataURL('image/png')
      const sigResponse = await fetch(sigDataUrl)
      const sigBlob = await sigResponse.blob()
      const sigBytes = new Uint8Array(await sigBlob.arrayBuffer())

      const buf = await readFileAsArrayBuffer(file)
      const doc = await PDFDocument.load(buf)
      const pages = doc.getPages()
      const targetPage = pages[Math.min(page - 1, pages.length - 1)]
      const { width } = targetPage.getSize()

      const sigImg = await doc.embedPng(sigBytes)
      const sigW = 160
      const sigH = (sigImg.height / sigImg.width) * sigW

      const margin = 24
      const xMap = {
        'bottom-right': width - sigW - margin,
        'bottom-left': margin,
        'bottom-center': (width - sigW) / 2,
      }

      targetPage.drawImage(sigImg, {
        x: xMap[position],
        y: margin,
        width: sigW,
        height: sigH,
      })

      setProgress(80)
      const bytes = await doc.save()
      downloadBlob(
        uint8ToBlob(bytes, 'application/pdf'),
        `${getFilenameWithoutExt(file.name)}_signed.pdf`
      )
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <FileDropZone onFiles={(f) => setFile(f[0] ?? null)} />

      {file && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">서명 그리기</p>
          <button onClick={clearCanvas} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> 지우기
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <p className="text-xs text-slate-400 text-center">마우스 또는 터치로 서명하세요</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">삽입 페이지</label>
          <input
            type="number"
            min={1}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">위치</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as typeof position)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
          >
            <option value="bottom-right">우측 하단</option>
            <option value="bottom-left">좌측 하단</option>
            <option value="bottom-center">중앙 하단</option>
          </select>
        </div>
      </div>

      {loading && <ProgressBar value={progress} label="서명 삽입 중..." />}

      <Button
        onClick={applySign}
        loading={loading}
        disabled={!file || !hasSignature}
        size="lg"
        className="w-full justify-center"
      >
        <Download className="w-4 h-4" />
        서명 삽입 후 저장
      </Button>
    </div>
  )
}
