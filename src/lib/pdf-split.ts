import { PDFDocument } from 'pdf-lib'
import { readFileAsArrayBuffer, getFilenameWithoutExt, uint8ToBlob } from './file-utils'
import type { ProcessResult, SplitOption } from '@/types'

function parseRanges(rangeStr: string, total: number): number[][] {
  return rangeStr.split(',').map((part) => {
    const [start, end] = part.trim().split('-').map(Number)
    const s = Math.max(1, start) - 1
    const e = Math.min(total, end ?? start) - 1
    return Array.from({ length: e - s + 1 }, (_, i) => s + i)
  })
}

export async function splitPDF(file: File, option: SplitOption): Promise<ProcessResult[]> {
  const buf = await readFileAsArrayBuffer(file)
  const src = await PDFDocument.load(buf)
  const total = src.getPageCount()
  const base = getFilenameWithoutExt(file.name)

  let groups: number[][] = []

  if (option.mode === 'every') {
    const n = option.everyN ?? 1
    for (let i = 0; i < total; i += n) {
      groups.push(Array.from({ length: Math.min(n, total - i) }, (_, j) => i + j))
    }
  } else if (option.mode === 'range' && option.ranges) {
    groups = parseRanges(option.ranges, total)
  } else if (option.mode === 'extract' && option.pages) {
    groups = option.pages.map((p) => [p - 1])
  } else {
    groups = Array.from({ length: total }, (_, i) => [i])
  }

  const results: ProcessResult[] = []
  for (let i = 0; i < groups.length; i++) {
    try {
      const doc = await PDFDocument.create()
      const pages = await doc.copyPages(src, groups[i])
      pages.forEach((p) => doc.addPage(p))
      const bytes = await doc.save()
      results.push({
        success: true,
        blob: uint8ToBlob(bytes, 'application/pdf'),
        filename: `${base}_part${i + 1}.pdf`,
      })
    } catch (e) {
      results.push({ success: false, error: String(e) })
    }
  }
  return results
}
