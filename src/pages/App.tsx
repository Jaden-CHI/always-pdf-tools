import { useState } from 'react'
import { Moon, Sun, GitMerge, Scissors, Minimize2, Image, Images, RotateCw, Droplets, Lock, PenLine, ShieldOff, LayoutGrid, ScanText, Eye, FilePenLine, FileText, FileSpreadsheet } from 'lucide-react'
import ToolCard from '@/components/ui/ToolCard'
import MergePDF from '@/components/tools/MergePDF'
import SplitPDF from '@/components/tools/SplitPDF'
import CompressPDF from '@/components/tools/CompressPDF'
import ConvertToImage from '@/components/tools/ConvertToImage'
import ConvertFromImage from '@/components/tools/ConvertFromImage'
import RotatePages from '@/components/tools/RotatePages'
import WatermarkPDF from '@/components/tools/WatermarkPDF'
import ProtectPDF from '@/components/tools/ProtectPDF'
import SignPDF from '@/components/tools/SignPDF'
import RemoveMetadata from '@/components/tools/RemoveMetadata'
import OrganizePages from '@/components/tools/OrganizePages'
import OCRTool from '@/components/tools/OCRTool'
import PDFViewer from '@/components/tools/PDFViewer'
import PDFEditor from '@/components/tools/PDFEditor'
import ProConversion from '@/components/tools/ProConversion'
import { useT } from '@/lib/i18n'
import type { ToolId } from '@/types'

const TOOL_DEFS = [
  { id: 'merge' as ToolId, nameKey: 'tool.merge.name', descKey: 'tool.merge.desc', icon: GitMerge, color: 'blue' },
  { id: 'split' as ToolId, nameKey: 'tool.split.name', descKey: 'tool.split.desc', icon: Scissors, color: 'red' },
  { id: 'compress' as ToolId, nameKey: 'tool.compress.name', descKey: 'tool.compress.desc', icon: Minimize2, color: 'green' },
  { id: 'to-image' as ToolId, nameKey: 'tool.toImage.name', descKey: 'tool.toImage.desc', icon: Image, color: 'purple' },
  { id: 'from-image' as ToolId, nameKey: 'tool.fromImage.name', descKey: 'tool.fromImage.desc', icon: Images, color: 'orange' },
  { id: 'rotate' as ToolId, nameKey: 'tool.rotate.name', descKey: 'tool.rotate.desc', icon: RotateCw, color: 'blue' },
  { id: 'organize' as ToolId, nameKey: 'tool.organize.name', descKey: 'tool.organize.desc', icon: LayoutGrid, color: 'purple' },
  { id: 'sign' as ToolId, nameKey: 'tool.sign.name', descKey: 'tool.sign.desc', icon: PenLine, color: 'green' },
  { id: 'watermark' as ToolId, nameKey: 'tool.watermark.name', descKey: 'tool.watermark.desc', icon: Droplets, color: 'slate' },
  { id: 'protect' as ToolId, nameKey: 'tool.protect.name', descKey: 'tool.protect.desc', icon: Lock, color: 'red' },
  { id: 'remove-metadata' as ToolId, nameKey: 'tool.removeMetadata.name', descKey: 'tool.removeMetadata.desc', icon: ShieldOff, color: 'slate' },
  { id: 'ocr' as ToolId, nameKey: 'tool.ocr.name', descKey: 'tool.ocr.desc', icon: ScanText, color: 'blue' },
  { id: 'viewer' as ToolId, nameKey: 'tool.viewer.name', descKey: 'tool.viewer.desc', icon: Eye, color: 'slate' },
  { id: 'editor' as ToolId, nameKey: 'tool.editor.name', descKey: 'tool.editor.desc', icon: FilePenLine, color: 'green' },
  { id: 'pdf-to-word' as ToolId, nameKey: 'tool.pdfToWord.name', descKey: 'tool.pdfToWord.desc', icon: FileText, color: 'blue', pro: true },
  { id: 'pdf-to-excel' as ToolId, nameKey: 'tool.pdfToExcel.name', descKey: 'tool.pdfToExcel.desc', icon: FileSpreadsheet, color: 'green', pro: true },
  { id: 'word-to-pdf' as ToolId, nameKey: 'tool.wordToPdf.name', descKey: 'tool.wordToPdf.desc', icon: FileText, color: 'blue', pro: true },
  { id: 'excel-to-pdf' as ToolId, nameKey: 'tool.excelToPdf.name', descKey: 'tool.excelToPdf.desc', icon: FileSpreadsheet, color: 'green', pro: true },
] as const

const TOOL_COMPONENTS: Partial<Record<ToolId, React.ComponentType>> = {
  merge: MergePDF,
  split: SplitPDF,
  compress: CompressPDF,
  'to-image': ConvertToImage,
  'from-image': ConvertFromImage,
  rotate: RotatePages,
  organize: OrganizePages,
  sign: SignPDF,
  watermark: WatermarkPDF,
  protect: ProtectPDF,
  'remove-metadata': RemoveMetadata,
  ocr: OCRTool,
  viewer: PDFViewer,
  editor: PDFEditor,
  'pdf-to-word': () => <ProConversion type="pdf-to-word" />,
  'pdf-to-excel': () => <ProConversion type="pdf-to-excel" />,
  'word-to-pdf': () => <ProConversion type="word-to-pdf" />,
  'excel-to-pdf': () => <ProConversion type="excel-to-pdf" />,
}

export default function App() {
  const { t, lang, setLang } = useT()
  const initialTool = window.location.hash.slice(1) as ToolId | ''
  const [activeTool, setActiveTool] = useState<ToolId | null>(
    TOOL_DEFS.find((d) => d.id === initialTool)?.id ?? null
  )
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  const ActiveComponent = activeTool ? TOOL_COMPONENTS[activeTool] : null
  const activeMeta = TOOL_DEFS.find((d) => d.id === activeTool)

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <img src="/icons/icon48.png" className="w-8 h-8 rounded-lg" alt="AlwaysPDF Tools" />
            <span className="font-bold text-slate-800 dark:text-white text-lg">AlwaysPDF Tools</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {lang === 'ko' ? 'EN' : 'KO'}
            </button>
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="flex flex-1">
          <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-4 space-y-1 hidden md:block overflow-y-auto">
            {TOOL_DEFS.map((def) => {
              const Icon = def.icon
              return (
                <button
                  key={def.id}
                  onClick={() => setActiveTool(def.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTool === def.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{t(def.nameKey)}</span>
                  {'pro' in def && def.pro && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      {t('common.pro')}
                    </span>
                  )}
                </button>
              )
            })}
          </aside>

          <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
            {!activeTool ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('app.title')}</h1>
                  <p className="text-sm text-slate-500 mt-1">{t('app.subtitle')}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TOOL_DEFS.map((def) => (
                    <ToolCard
                      key={def.id}
                      icon={def.icon}
                      name={t(def.nameKey)}
                      description={t(def.descKey)}
                      color={def.color}
                      badge={'pro' in def && def.pro ? t('common.pro') : undefined}
                      onClick={() => setActiveTool(def.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTool(null)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('app.back')}
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    {activeMeta ? t(activeMeta.nameKey) : ''}
                  </h2>
                </div>
                {ActiveComponent && <ActiveComponent />}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
