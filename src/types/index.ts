export type ToolId =
  | 'merge'
  | 'split'
  | 'compress'
  | 'to-image'
  | 'from-image'
  | 'rotate'
  | 'organize'
  | 'sign'
  | 'watermark'
  | 'protect'
  | 'remove-metadata'

export interface Tool {
  id: ToolId
  name: string
  description: string
  icon: string
  category: ToolCategory
}

export type ToolCategory = 'organize' | 'convert' | 'edit' | 'security'

export interface PDFFile {
  id: string
  file: File
  name: string
  size: number
  pageCount?: number
}

export interface ProcessResult {
  success: boolean
  blob?: Blob
  filename?: string
  error?: string
}

export interface SplitOption {
  mode: 'range' | 'every' | 'extract'
  ranges?: string
  everyN?: number
  pages?: number[]
}

export interface WatermarkOption {
  text: string
  opacity: number
  fontSize: number
  angle: number
  color: string
}

export interface ProtectOption {
  password: string
  mode: 'protect' | 'unlock'
  unlockPassword?: string
}
