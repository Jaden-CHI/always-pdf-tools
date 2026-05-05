import { PDFDocument } from 'pdf-lib'
import { readFileAsArrayBuffer, getFilenameWithoutExt, uint8ToBlob } from './file-utils'
import type { ProcessResult } from '@/types'

export async function compressPDF(file: File, quality: number): Promise<ProcessResult> {
  try {
    const buf = await readFileAsArrayBuffer(file)
    const src = await PDFDocument.load(buf)
    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(src, src.getPageIndices())
    pages.forEach((p) => doc.addPage(p))

    const useObjectStreams = quality < 70
    const bytes = await doc.save({ useObjectStreams })
    const base = getFilenameWithoutExt(file.name)
    return {
      success: true,
      blob: uint8ToBlob(bytes, 'application/pdf'),
      filename: `${base}_compressed.pdf`,
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
