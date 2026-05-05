import { PDFDocument } from 'pdf-lib'
import { readFileAsArrayBuffer, uint8ToBlob } from './file-utils'
import type { ProcessResult } from '@/types'

export async function mergePDFs(files: File[]): Promise<ProcessResult> {
  try {
    const merged = await PDFDocument.create()
    for (const file of files) {
      const buf = await readFileAsArrayBuffer(file)
      const doc = await PDFDocument.load(buf)
      const pages = await merged.copyPages(doc, doc.getPageIndices())
      pages.forEach((p) => merged.addPage(p))
    }
    const bytes = await merged.save()
    return {
      success: true,
      blob: uint8ToBlob(bytes, 'application/pdf'),
      filename: 'merged.pdf',
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
