import type { LangType } from './config'
import { FALLBACK_LOCALE } from './config'

export const commonI18n = {
  zh: () => import('./common/zh.json'),
  en: () => import('./common/en.json'),
  ar: () => import('./common/ar.json'),
} as Record<LangType, () => Promise<any>>

export type PageI18nConfig = Record<LangType, () => Promise<any>>

// 消息缓存
const messagesCache: Partial<Record<LangType, any>> = {}
// 正在加载的语言
const loadingPromises: Partial<Record<LangType, Promise<any>>> = {}

let currentPageI18nConfig: PageI18nConfig | undefined

/**
 * 加载单个语言的消息（公共 + 页面）
 */
export async function loadMessage(locale: LangType, pageI18n?: PageI18nConfig): Promise<any> {
  // 如果已缓存，直接返回
  if (messagesCache[locale]) {
    return messagesCache[locale]
  }

  // 如果正在加载，等待现有的加载完成
  if (loadingPromises[locale]) {
    return loadingPromises[locale]
  }

  // 开始加载
  const loadPromise = (async () => {
    try {
      // 加载公共语言
      const commonModule = await commonI18n[locale]()
      const commonMsg = commonModule.default || commonModule

      // 加载页面语言
      let pageMsg = {}
      const config = pageI18n || currentPageI18nConfig
      if (config?.[locale]) {
        try {
          const pageModule = await config[locale]()
          pageMsg = pageModule.default || pageModule
        } catch (error) {
          console.warn(`页面语言 ${locale} 加载失败:`, error)
        }
      }

      // 合并消息
      const messages = {
        ...commonMsg,
        ...pageMsg,
      }

      // 缓存
      messagesCache[locale] = messages
      return messages
    } catch (error) {
      console.warn(`语种 ${locale} 加载失败:`, error)
      messagesCache[locale] = {}
      return {}
    } finally {
      delete loadingPromises[locale]
    }
  })()

  loadingPromises[locale] = loadPromise
  return loadPromise
}

/**
 * 按需加载 fallback 语言（仅在需要时加载）
 */
export async function loadFallbackIfNeeded(): Promise<void> {
  if (!messagesCache[FALLBACK_LOCALE]) {
    await loadMessage(FALLBACK_LOCALE, currentPageI18nConfig)
  }
}

/**
 * 初始化加载：只加载当前语言
 */
export async function loadMessages(
  currentLocale: LangType,
  pageI18n: PageI18nConfig
): Promise<Record<LangType, any>> {
  // 保存页面配置供后续动态加载使用
  currentPageI18nConfig = pageI18n

  // 只加载当前语言
  const currentMessages = await loadMessage(currentLocale, pageI18n)

  return {
    [currentLocale]: currentMessages,
  } as Record<LangType, any>
}

/**
 * 获取已加载的消息缓存
 */
export function getMessagesCache(): Partial<Record<LangType, any>> {
  return messagesCache
}
