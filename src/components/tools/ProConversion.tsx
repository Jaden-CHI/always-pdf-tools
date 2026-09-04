import { useState } from 'react'
import { Cloud, FileSpreadsheet, FileText, ShieldCheck, TimerReset } from 'lucide-react'
import { useT } from '@/lib/i18n'
import Button from '@/components/ui/Button'
import FileDropZone from '@/components/ui/FileDropZone'
import ProgressBar from '@/components/ui/ProgressBar'
import { convertWithProApi, isProApiConfigured, type ProConversionType } from '@/lib/pro-conversion-api'
import { downloadBlob, getFilenameWithoutExt } from '@/lib/file-utils'

interface ProConversionProps {
  type: ProConversionType
}

const ACCEPT_MAP: Record<ProConversionType, string> = {
  'pdf-to-word': '.pdf',
  'pdf-to-excel': '.pdf',
  'word-to-pdf': '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'excel-to-pdf': '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

const EXT_MAP: Record<ProConversionType, string> = {
  'pdf-to-word': 'docx',
  'pdf-to-excel': 'xlsx',
  'word-to-pdf': 'pdf',
  'excel-to-pdf': 'pdf',
}

export default function ProConversion({ type }: ProConversionProps) {
  const { t } = useT()
  const [file, setFile] = useState<File | null>(null)
  const [consented, setConsented] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const Icon = type === 'pdf-to-excel' || type === 'excel-to-pdf' ? FileSpreadsheet : FileText
  const titleMap = {
    'pdf-to-word': t('pro.pdfToWord.title'),
    'pdf-to-excel': t('pro.pdfToExcel.title'),
    'word-to-pdf': t('pro.wordToPdf.title'),
    'excel-to-pdf': t('pro.excelToPdf.title'),
  }
  const descriptionMap = {
    'pdf-to-word': t('pro.pdfToWord.desc'),
    'pdf-to-excel': t('pro.pdfToExcel.desc'),
    'word-to-pdf': t('pro.wordToPdf.desc'),
    'excel-to-pdf': t('pro.excelToPdf.desc'),
  }
  const title = titleMap[type]
  const description = descriptionMap[type]
  const apiConfigured = isProApiConfigured()

  const handleConvert = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setDone(false)
    setProgress(5)

    try {
      const result = await convertWithProApi(type, file, setProgress)
      const fallbackName = `${getFilenameWithoutExt(file.name)}.${EXT_MAP[type]}`
      downloadBlob(result.blob, result.filename || fallbackName)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 800)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-amber-900/40 dark:text-amber-300">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                {t('pro.badge')}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Cloud className="mb-3 h-5 w-5 text-blue-500" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{t('pro.cloud.title')}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('pro.cloud.desc')}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <ShieldCheck className="mb-3 h-5 w-5 text-emerald-500" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{t('pro.privacy.title')}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('pro.privacy.desc')}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <TimerReset className="mb-3 h-5 w-5 text-purple-500" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{t('pro.delete.title')}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('pro.delete.desc')}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-800 dark:text-white">{t('pro.next.title')}</p>
        <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>{t('pro.next.api')}</li>
          <li>{t('pro.next.billing')}</li>
          <li>{t('pro.next.upload')}</li>
        </ol>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <FileDropZone
          accept={ACCEPT_MAP[type]}
          multiple={false}
          label={t('pro.dropzone.label')}
          sublabel={type.includes('pdf-to') ? t('pro.dropzone.pdf') : type === 'word-to-pdf' ? t('pro.dropzone.word') : t('pro.dropzone.excel')}
          onFiles={(files) => {
            setFile(files[0] ?? null)
            setDone(false)
            setError('')
          }}
        />

        {file && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            {file.name}
          </div>
        )}

        <label className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-1"
          />
          <span>{t('pro.consent')}</span>
        </label>

        {!apiConfigured && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            {t('pro.api.notConfigured')}
          </div>
        )}

        {loading && <ProgressBar value={progress} label={t('pro.running')} />}
        {done && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t('pro.done')}</p>}
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <Button
          className="w-full justify-center"
          loading={loading}
          disabled={!file || !consented || !apiConfigured}
          onClick={handleConvert}
        >
          {apiConfigured ? t('pro.cta.convert') : t('pro.cta.disabled')}
        </Button>
      </div>
    </div>
  )
}
