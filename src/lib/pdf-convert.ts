import { PDFDocument } from 'pdf-lib'
import { readFileAsArrayBuffer, getFilenameWithoutExt, uint8ToBlob } from './file-utils'
import type { ProcessResult } from '@/types'

export async function pdfToImages(
  file: File,
  format: 'jpeg' | 'png' = 'jpeg',
  scale: number = 2
): Promise<ProcessResult[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString()

    const buf = await readFileAsArrayBuffer(file)
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise
    const base = getFilenameWithoutExt(file.name)
    const results: ProcessResult[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), mimeType, 0.92)
      )
      results.push({
        success: true,
        blob,
        filename: `${base}_page${i}.${format}`,
      })
    }
    return results
  } catch (e) {
    return [{ success: false, error: String(e) }]
  }
}

export async function imagesToPDF(files: File[]): Promise<ProcessResult> {
  try {
    const doc = await PDFDocument.create()
    for (const file of files) {
      const buf = await readFileAsArrayBuffer(file)
      const isJpeg = file.type === 'image/jpeg'
      const img = isJpeg
        ? await doc.embedJpg(new Uint8Array(buf))
        : await doc.embedPng(new Uint8Array(buf))
      const page = doc.addPage([img.width, img.height])
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
    }
    const bytes = await doc.save()
    return {
      success: true,
      blob: uint8ToBlob(bytes, 'application/pdf'),
      filename: 'images_to_pdf.pdf',
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
