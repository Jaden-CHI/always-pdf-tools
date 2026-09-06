import { GitMerge, Scissors, Minimize2, Image, Images, RotateCw, Droplets, Lock, ExternalLink, PenLine, ShieldOff, LayoutGrid, ScanText, Eye, FilePenLine, FileText, FileSpreadsheet, Presentation, Hash, Crop, FileCheck2 } from 'lucide-react'
import { useT } from '@/lib/i18n'

const TOOL_DEFS = [
  { nameKey: 'tool.merge.name', icon: GitMerge, color: 'text-blue-600', tool: 'merge' },
  { nameKey: 'tool.split.name', icon: Scissors, color: 'text-red-500', tool: 'split' },
  { nameKey: 'tool.compress.name', icon: Minimize2, color: 'text-green-600', tool: 'compress' },
  { nameKey: 'tool.toImage.name', icon: Image, color: 'text-purple-600', tool: 'to-image' },
  { nameKey: 'tool.fromImage.name', icon: Images, color: 'text-orange-500', tool: 'from-image' },
  { nameKey: 'tool.rotate.name', icon: RotateCw, color: 'text-blue-500', tool: 'rotate' },
  { nameKey: 'tool.organize.name', icon: LayoutGrid, color: 'text-purple-500', tool: 'organize' },
  { nameKey: 'tool.sign.name', icon: PenLine, color: 'text-green-500', tool: 'sign' },
  { nameKey: 'tool.watermark.name', icon: Droplets, color: 'text-slate-500', tool: 'watermark' },
  { nameKey: 'tool.protect.name', icon: Lock, color: 'text-red-600', tool: 'protect' },
  { nameKey: 'tool.removeMetadata.name', icon: ShieldOff, color: 'text-slate-400', tool: 'remove-metadata' },
  { nameKey: 'tool.ocr.name', icon: ScanText, color: 'text-blue-500', tool: 'ocr' },
  { nameKey: 'tool.viewer.name', icon: Eye, color: 'text-slate-500', tool: 'viewer' },
  { nameKey: 'tool.editor.name', icon: FilePenLine, color: 'text-green-500', tool: 'editor' },
  { nameKey: 'tool.pageNumbers.name', icon: Hash, color: 'text-blue-500', tool: 'page-numbers' },
  { nameKey: 'tool.crop.name', icon: Crop, color: 'text-slate-500', tool: 'crop-pdf' },
  { nameKey: 'tool.pdfToText.name', icon: FileText, color: 'text-green-500', tool: 'pdf-to-text' },
  { nameKey: 'tool.pdfToWord.name', icon: FileText, color: 'text-blue-500', tool: 'pdf-to-word', pro: true },
  { nameKey: 'tool.pdfToExcel.name', icon: FileSpreadsheet, color: 'text-green-500', tool: 'pdf-to-excel', pro: true },
  { nameKey: 'tool.pdfToPpt.name', icon: Presentation, color: 'text-orange-500', tool: 'pdf-to-ppt', pro: true },
  { nameKey: 'tool.wordToPdf.name', icon: FileText, color: 'text-blue-500', tool: 'word-to-pdf', pro: true },
  { nameKey: 'tool.excelToPdf.name', icon: FileSpreadsheet, color: 'text-green-500', tool: 'excel-to-pdf', pro: true },
  { nameKey: 'tool.pptToPdf.name', icon: Presentation, color: 'text-orange-500', tool: 'ppt-to-pdf', pro: true },
  { nameKey: 'tool.searchablePdf.name', icon: ScanText, color: 'text-purple-500', tool: 'searchable-pdf', pro: true },
  { nameKey: 'tool.strongCompress.name', icon: Minimize2, color: 'text-red-500', tool: 'strong-compress', pro: true },
  { nameKey: 'tool.pdfToPdfa.name', icon: FileCheck2, color: 'text-slate-500', tool: 'pdf-to-pdfa', pro: true },
] as const

export default function Popup() {
  const { t, lang, setLang } = useT()

  const openTool = (tool: string) => {
    const url = chrome.runtime.getURL(`src/pages/index.html#${tool}`)
    chrome.tabs.create({ url })
  }

  const openMain = () => {
    const url = chrome.runtime.getURL('src/pages/index.html')
    chrome.tabs.create({ url })
  }

  return (
    <div className="w-[380px] bg-white dark:bg-slate-900 font-sans">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icons/icon48.png" className="w-7 h-7 rounded-lg" alt="AlwaysPDF Tools" />
          <span className="font-bold text-slate-800 dark:text-white text-sm">AlwaysPDF Tools</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
            className="px-2 py-1 rounded text-[10px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {lang === 'ko' ? 'EN' : 'KO'}
          </button>
          <button
            onClick={openMain}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('app.fullscreen')} <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2">
        {TOOL_DEFS.map((def) => {
          const Icon = def.icon
          return (
            <button
              key={def.tool}
              onClick={() => openTool(def.tool)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${def.color}`} />
              <span className="min-w-0 flex-1 text-xs font-medium text-slate-700 dark:text-slate-300">{t(def.nameKey)}</span>
              {'pro' in def && def.pro && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {t('common.pro')}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 text-center">{t('app.footer')}</p>
      </div>
    </div>
  )
}
