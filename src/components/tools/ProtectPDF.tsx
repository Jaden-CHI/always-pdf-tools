import { useState } from 'react'
import { Download, Lock, Unlock } from 'lucide-react'
import FileDropZone from '@/components/ui/FileDropZone'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { protectPDF, unlockPDF } from '@/lib/pdf-protect'
import { downloadBlob, formatFileSize } from '@/lib/file-utils'

export default function ProtectPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'protect' | 'unlock'>('protect')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const onFile = (files: File[]) => {
    setFile(files[0] ?? null)
    setError('')
  }

  const process = async () => {
    if (!file || !password.trim()) return
    setLoading(true)
    setProgress(40)
    setError('')
    const result =
      mode === 'protect'
        ? await protectPDF(file, password)
        : await unlockPDF(file, password)
    setProgress(100)
    if (result.success && result.blob) {
      downloadBlob(result.blob, result.filename!)
    } else {
      setError(result.error ?? '처리 중 오류가 발생했습니다.')
    }
    setLoading(false)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2">
        {([['protect', '비밀번호 설정', Lock], ['unlock', '비밀번호 해제', Unlock]] as const).map(
          ([m, label, Icon]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                mode === m
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        )}
      </div>

      <FileDropZone onFiles={onFile} />

      {file && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {mode === 'protect' ? '설정할 비밀번호' : '현재 비밀번호'}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 입력"
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {loading && <ProgressBar value={progress} label={mode === 'protect' ? '보호 적용 중...' : '잠금 해제 중...'} />}

      <Button
        onClick={process}
        loading={loading}
        disabled={!file || !password.trim()}
        size="lg"
        className="w-full justify-center"
      >
        <Download className="w-4 h-4" />
        {mode === 'protect' ? '비밀번호 설정 후 저장' : '잠금 해제 후 저장'}
      </Button>
    </div>
  )
}
