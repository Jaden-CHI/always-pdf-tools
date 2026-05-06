import { useState } from 'react'
import { Moon, Sun, FileText, GitMerge, Scissors, Minimize2, Image, Images, RotateCw, Droplets, Lock, PenLine, ShieldOff, LayoutGrid, ScanText } from 'lucide-react'
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
import type { ToolId } from '@/types'

const TOOLS = [
  { id: 'merge' as ToolId, name: 'PDF 합치기', description: '여러 PDF를 하나로 병합합니다', icon: GitMerge, color: 'blue' },
  { id: 'split' as ToolId, name: 'PDF 분할', description: 'PDF를 여러 파일로 나눕니다', icon: Scissors, color: 'red' },
  { id: 'compress' as ToolId, name: 'PDF 압축', description: '파일 용량을 줄입니다', icon: Minimize2, color: 'green' },
  { id: 'to-image' as ToolId, name: 'PDF → 이미지', description: 'PDF 페이지를 이미지로 변환합니다', icon: Image, color: 'purple' },
  { id: 'from-image' as ToolId, name: '이미지 → PDF', description: '이미지를 PDF로 변환합니다', icon: Images, color: 'orange' },
  { id: 'rotate' as ToolId, name: '페이지 회전', description: 'PDF 페이지 방향을 회전합니다', icon: RotateCw, color: 'blue' },
  { id: 'organize' as ToolId, name: '페이지 정리', description: '페이지 삭제 및 순서를 변경합니다', icon: LayoutGrid, color: 'purple' },
  { id: 'sign' as ToolId, name: 'PDF 서명', description: '직접 그린 서명을 PDF에 삽입합니다', icon: PenLine, color: 'green' },
  { id: 'watermark' as ToolId, name: '워터마크', description: '텍스트 워터마크를 추가합니다', icon: Droplets, color: 'slate' },
  { id: 'protect' as ToolId, name: '비밀번호 보호', description: 'PDF를 비밀번호로 보호/해제합니다', icon: Lock, color: 'red' },
  { id: 'remove-metadata' as ToolId, name: '메타데이터 제거', description: '작성자·제목 등 개인정보를 삭제합니다', icon: ShieldOff, color: 'slate' },
  { id: 'ocr' as ToolId, name: 'OCR 텍스트 추출', description: 'PDF·이미지에서 텍스트를 인식합니다', icon: ScanText, color: 'blue' },
]

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
}

export default function App() {
  const initialTool = window.location.hash.slice(1) as ToolId | ''
  const [activeTool, setActiveTool] = useState<ToolId | null>(
    TOOLS.find((t) => t.id === initialTool)?.id ?? null
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
  const activeMeta = TOOLS.find((t) => t.id === activeTool)

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-lg">AlwaysPDF Tools</span>
          </div>
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <div className="flex flex-1">
          <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-4 space-y-1 hidden md:block overflow-y-auto">
            {TOOLS.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTool === tool.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tool.name}
                </button>
              )
            })}
          </aside>

          <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
            {!activeTool ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">PDF 도구 모음</h1>
                  <p className="text-sm text-slate-500 mt-1">모든 작업은 브라우저 내에서 처리됩니다. 파일이 서버로 전송되지 않습니다.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TOOLS.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      icon={tool.icon}
                      name={tool.name}
                      description={tool.description}
                      color={tool.color}
                      onClick={() => setActiveTool(tool.id)}
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
                    ← 도구 목록
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">{activeMeta?.name}</h2>
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
