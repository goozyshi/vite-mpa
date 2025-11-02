import type { LangType } from '@/i18n/config'

export type PageI18nConfig = Record<LangType, () => Promise<{ default: Record<string, any> }>>

declare module '@/i18n/common/*.json' {
  const value: Record<string, any>
  export default value
}

declare module '@/page/*/i18n/*.json' {
  const value: Record<string, any>
  export default value
}
