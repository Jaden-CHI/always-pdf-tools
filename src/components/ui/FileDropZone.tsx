import { useRef, type DragEvent, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'

interface FileDropZoneProps {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  label?: string
  sublabel?: string
}

export default function FileDropZone({
  accept = '.pdf',
  multiple = false,
  onFiles,
  label = 'PDF 파일을 드래그하거나 클릭해서 선택하세요',
  sublabel,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = (files: FileList | null) => {
    if (!files) return
    onFiles(Array.from(files))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    handle(e.dataTransfer.files)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => handle(e.target.files)

  return (
    <div
      className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
        <Upload className="w-7 h-7 text-blue-600 dark:text-blue-400" />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">{label}</p>
      {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}
