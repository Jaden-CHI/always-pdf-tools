import { FileText, GitMerge, Scissors, Minimize2, Image, Images, RotateCw, Droplets, Lock, ExternalLink } from 'lucide-react'

const TOOLS = [
  { name: 'PDF 합치기', icon: GitMerge, color: 'text-blue-600', tool: 'merge' },
  { name: 'PDF 분할', icon: Scissors, color: 'text-red-500', tool: 'split' },
  { name: 'PDF 압축', icon: Minimize2, color: 'text-green-600', tool: 'compress' },
  { name: 'PDF → 이미지', icon: Image, color: 'text-purple-600', tool: 'to-image' },
  { name: '이미지 → PDF', icon: Images, color: 'text-orange-500', tool: 'from-image' },
  { name: '페이지 회전', icon: RotateCw, color: 'text-blue-500', tool: 'rotate' },
  { name: '워터마크', icon: Droplets, color: 'text-slate-500', tool: 'watermark' },
  { name: '비밀번호 보호', icon: Lock, color: 'text-red-600', tool: 'protect' },
]

export default function Popup() {
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
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-sm">AlwasyPDF Tools</span>
        </div>
        <button
          onClick={openMain}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          전체 화면 <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.tool}
              onClick={() => openTool(tool.tool)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${tool.color}`} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{tool.name}</span>
            </button>
          )
        })}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 text-center">모든 파일은 브라우저에서만 처리됩니다</p>
      </div>
    </div>
  )
}
