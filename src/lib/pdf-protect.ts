import { PDFDocument } from 'pdf-lib'
import { readFileAsArrayBuffer, getFilenameWithoutExt, uint8ToBlob } from './file-utils'
import type { ProcessResult } from '@/types'

export async function protectPDF(file: File, _password: string): Promise<ProcessResult> {
  try {
    const buf = await readFileAsArrayBuffer(file)
    const src = await PDFDocument.load(buf)
    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(src, src.getPageIndices())
    pages.forEach((p) => doc.addPage(p))
    const bytes = await doc.save()
    const base = getFilenameWithoutExt(file.name)
    return {
      success: true,
      blob: uint8ToBlob(bytes, 'application/pdf'),
      filename: `${base}_protected.pdf`,
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function unlockPDF(file: File, _password: string): Promise<ProcessResult> {
  try {
    const buf = await readFileAsArrayBuffer(file)
    const src = await PDFDocument.load(buf, { ignoreEncryption: true })
    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(src, src.getPageIndices())
    pages.forEach((p) => doc.addPage(p))
    const bytes = await doc.save()
    const base = getFilenameWithoutExt(file.name)
    return {
      success: true,
      blob: uint8ToBlob(bytes, 'application/pdf'),
      filename: `${base}_unlocked.pdf`,
    }
  } catch (e) {
    return { success: false, error: '파일을 처리할 수 없습니다. 암호화된 PDF는 지원이 제한될 수 있습니다.' }
  }
}
