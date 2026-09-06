export type ProConversionType =
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'pdf-to-ppt'
  | 'word-to-pdf'
  | 'excel-to-pdf'
  | 'ppt-to-pdf'
  | 'searchable-pdf'
  | 'strong-compress'
  | 'pdf-to-pdfa'

export interface ProConversionResponse {
  blob: Blob
  filename: string
}

export class ProConversionError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ProConversionError'
    this.status = status
    this.detail = detail
  }
}

const API_BASE_URL = import.meta.env.VITE_PRO_API_BASE_URL?.replace(/\/$/, '') ?? ''

const ENDPOINTS: Record<ProConversionType, string> = {
  'pdf-to-word': '/convert/pdf-to-word',
  'pdf-to-excel': '/convert/pdf-to-excel',
  'pdf-to-ppt': '/convert/pdf-to-ppt',
  'word-to-pdf': '/convert/word-to-pdf',
  'excel-to-pdf': '/convert/excel-to-pdf',
  'ppt-to-pdf': '/convert/ppt-to-pdf',
  'searchable-pdf': '/convert/searchable-pdf',
  'strong-compress': '/convert/strong-compress',
  'pdf-to-pdfa': '/convert/pdf-to-pdfa',
}

function readFilenameFromDisposition(value: string | null): string | null {
  if (!value) return null
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1])
  const plainMatch = value.match(/filename="?([^"]+)"?/i)
  return plainMatch?.[1] ?? null
}

export function isProApiConfigured(): boolean {
  return API_BASE_URL.length > 0
}

async function readErrorDetail(blob: Blob): Promise<string> {
  const text = await blob.text()
  if (!text) return ''

  try {
    const parsed = JSON.parse(text) as { detail?: unknown }
    return typeof parsed.detail === 'string' ? parsed.detail : text
  } catch {
    return text
  }
}

export async function convertWithProApi(
  type: ProConversionType,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ProConversionResponse> {
  if (!API_BASE_URL) {
    throw new Error('Pro conversion API is not configured.')
  }

  const form = new FormData()
  form.append('file', file)
  form.append('conversionType', type)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}${ENDPOINTS[type]}`)
    xhr.responseType = 'blob'

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      onProgress?.(Math.round((event.loaded / event.total) * 70))
    }

    xhr.onload = async () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        const detail = await readErrorDetail(xhr.response)
        reject(new ProConversionError(xhr.status, detail || `Pro conversion failed. (${xhr.status})`))
        return
      }

      onProgress?.(100)
      const filename = readFilenameFromDisposition(xhr.getResponseHeader('Content-Disposition')) ?? 'converted-file'
      resolve({ blob: xhr.response, filename })
    }

    xhr.onerror = () => reject(new Error('Network error while connecting to Pro conversion API.'))
    xhr.send(form)
  })
}
