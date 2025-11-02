/**
 * 多语言配置 - 统一管理所有语种
 */

export const SUPPORTED_LOCALES = ['en', 'zh', 'ar'] as const

export type LangType = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: LangType = 'en'

export const FALLBACK_LOCALE: LangType = 'en'

export const LOCALE_CONFIG: Record<
  LangType,
  {
    name: string
    label: string
    dir: 'ltr' | 'rtl'
  }
> = {
  en: {
    name: 'English',
    label: 'English',
    dir: 'ltr',
  },
  zh: {
    name: 'Chinese',
    label: '中文',
    dir: 'ltr',
  },
  ar: {
    name: 'Arabic',
    label: 'العربية',
    dir: 'rtl',
  },
}

export const RTL_LOCALES: LangType[] = ['ar']

export function isRTLLocale(locale: LangType): boolean {
  return RTL_LOCALES.includes(locale)
}
