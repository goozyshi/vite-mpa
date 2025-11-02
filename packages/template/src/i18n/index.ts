import type { LangType } from './config'
import { SUPPORTED_LOCALES } from './config'

export const commonI18n = {
  zh: () => import('./common/zh.json'),
  en: () => import('./common/en.json'),
  ar: () => import('./common/ar.json'),
} as Record<LangType, () => Promise<any>>

export type PageI18nConfig = Record<LangType, () => Promise<any>>

export async function loadMessages(
  pageI18n: PageI18nConfig
): Promise<Record<LangType, any>> {
  const messages: Record<LangType, any> = {} as any

  await Promise.all(
    SUPPORTED_LOCALES.map(async (locale) => {
      try {
        const commonModule = await commonI18n[locale]()
        const commonMsg = commonModule.default || commonModule

        let pageMsg = {}
        if (pageI18n[locale]) {
          const pageModule = await pageI18n[locale]()
          pageMsg = pageModule.default || pageModule
        }

        messages[locale] = {
          ...commonMsg,
          ...pageMsg,
        }
      } catch (error) {
        console.warn(`语种 ${locale} 加载失败:`, error)
        messages[locale] = {}
      }
    })
  )

  return messages
}

