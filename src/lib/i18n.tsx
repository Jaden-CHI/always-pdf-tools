import { createContext, useContext, useState, type ReactNode } from 'react'
import ko, { type TKey } from '@/locales/ko'
import en from '@/locales/en'

type Lang = 'ko' | 'en'

const DICTS: Record<Lang, typeof ko> = { ko, en: en as typeof ko }

function detectLang(): Lang {
  const primary = navigator.language.toLowerCase()
  return primary.startsWith('ko') ? 'ko' : 'en'
}

type FuncKey1 =
  | 'merge.fileCount'
  | 'fromImage.fileCount'
  | 'organize.selected'
  | 'watermark.opacity'
  | 'watermark.fontSize'
  | 'ocr.page'
  | 'editor.save'
  | 'pro.error.server'

type FuncKey2 = 'ocr.status.page' | 'viewer.page'

type TFunc = {
  (key: Exclude<TKey, FuncKey1 | FuncKey2>): string
  (key: FuncKey1, n: number): string
  (key: FuncKey2, i: number, total: number): string
}

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: TFunc
}

const Ctx = createContext<LangCtx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectLang)

  const t = ((key: TKey, ...args: number[]) => {
    const val = DICTS[lang][key]
    if (typeof val === 'function') return (val as (...a: number[]) => string)(...args)
    return val as string
  }) as TFunc

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useT() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useT must be used inside LangProvider')
  return ctx
}
