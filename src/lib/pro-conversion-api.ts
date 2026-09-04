export type ProConversionType = 'pdf-to-word' | 'pdf-to-excel' | 'word-to-pdf' | 'excel-to-pdf'

export interface ProConversionResponse {
  blob: Blob
  filename: string
}

const API_BASE_URL = import.meta.env.VITE_PRO_API_BASE_URL?.replace(/\/$/, '') ?? ''

const ENDPOINTS: Record<ProConversionType, string> = {
  'pdf-to-word': '/convert/pdf-to-word',
  'pdf-to-excel': '/convert/pdf-to-excel',
  'word-to-pdf': '/convert/word-to-pdf',
  'excel-to-pdf': '/convert/excel-to-pdf',
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

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Pro conversion failed. (${xhr.status})`))
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
