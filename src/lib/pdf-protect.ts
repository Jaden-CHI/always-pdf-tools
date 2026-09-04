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

export async function unlockPDF(file: File, password: string): Promise<ProcessResult> {
  try {
    const buf = await readFileAsArrayBuffer(file)
    const { createQpdfRunner } = await import('qpdf-run')
    const qpdf = await createQpdfRunner({
      workerUrl: new URL('qpdf-run/worker', import.meta.url).href,
      qpdfJsUrl: new URL('qpdf-run/qpdf.js', import.meta.url).href,
      wasmUrl: new URL('qpdf-run/qpdf.wasm', import.meta.url).href,
      timeoutMs: 60000,
    })

    let bytes: Uint8Array
    try {
      bytes = await qpdf.runOne({
        input: new Uint8Array(buf),
        inputName: 'input.pdf',
        outputName: 'output.pdf',
        args: [
          `--password=${password}`,
          '--decrypt',
          '--',
          'input.pdf',
          'output.pdf',
        ],
      })
    } finally {
      await qpdf.destroy()
    }

    const base = getFilenameWithoutExt(file.name)
    return {
      success: true,
      blob: uint8ToBlob(bytes, 'application/pdf'),
      filename: `${base}_unlocked.pdf`,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return {
      success: false,
      error: message.includes('invalid password') || message.includes('password')
        ? '비밀번호가 올바르지 않거나 이 PDF 암호화 방식은 지원되지 않습니다.'
        : '암호 해제 중 오류가 발생했습니다. 다른 암호화 방식의 PDF일 수 있습니다.',
    }
  }
}
