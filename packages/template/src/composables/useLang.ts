import { ref, computed, watchEffect, type Ref, type ComputedRef } from 'vue'
import { createI18n } from 'vue-i18n'
import type { App } from 'vue'
import {
  loadMessages,
  loadMessage,
  loadFallbackIfNeeded,
  getMessagesCache,
  type PageI18nConfig,
} from '@/i18n'
import {
  type LangType,
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  isRTLLocale,
  SUPPORTED_LOCALES,
} from '@/i18n/config'

function getUrlLang(): LangType | null {
  const params = new URLSearchParams(window.location.search)
  const urlLang = params.get('lang')
  if (urlLang && SUPPORTED_LOCALES.includes(urlLang as LangType)) {
    return urlLang as LangType
  }
  return null
}

function setUrlLang(lang: LangType) {
  const url = new URL(window.location.href)
  url.searchParams.set('lang', lang)
  window.history.replaceState({}, '', url.toString())
}

function getInitialLanguage(): string {
  const urlLang = getUrlLang()
  if (urlLang) return urlLang

  if (import.meta.env.DEV) {
    const devLang = sessionStorage.getItem('dev_lang')
    if (devLang) return devLang
  }

  const browserLang = navigator.language.slice(0, 2).toLowerCase()
  if (browserLang.indexOf('zh') > -1) return 'zh'
  if (browserLang.indexOf('ar') > -1) return 'ar'

  return DEFAULT_LOCALE
}

// 懒初始化响应式状态
let language: Ref<string>
let lang: ComputedRef<LangType>
let isRTL: ComputedRef<boolean>
let initialized = false

function initReactiveState() {
  if (initialized) return

  language = ref<string>(getInitialLanguage())

  lang = computed<LangType>(() => {
    const lowerLang = language.value?.toLowerCase() || ''
    if (lowerLang.indexOf('zh') > -1) return 'zh'
    if (lowerLang.indexOf('ar') > -1) return 'ar'
    if (lowerLang.indexOf('en') > -1) return 'en'
    return DEFAULT_LOCALE
  })

  isRTL = computed(() => isRTLLocale(lang.value))

  initialized = true
}

let i18n: ReturnType<typeof createI18n>

export function useLang() {
  // 确保响应式状态已初始化
  initReactiveState()

  const setupI18n = async (app: App, pageI18n: PageI18nConfig) => {
    // 只加载当前语言
    const messages = await loadMessages(lang.value, pageI18n)

    i18n = createI18n({
      locale: lang.value,
      fallbackLocale: FALLBACK_LOCALE,
      messages,
      legacy: false,
      missingWarn: import.meta.env.DEV,
      fallbackWarn: import.meta.env.DEV,
      // 当翻译缺失时，动态加载 fallback 语言
      missing: (locale: string, key: string) => {
        if (import.meta.env.DEV) {
          console.warn(`[i18n] 缺失翻译 key: ${key}, locale: ${locale}`)
        }

        // 如果当前语言不是 fallback 语言，且 fallback 还未加载，则动态加载
        if (locale !== FALLBACK_LOCALE) {
          const cache = getMessagesCache()
          if (!cache[FALLBACK_LOCALE]) {
            // 异步加载 fallback，不阻塞当前渲染
            loadFallbackIfNeeded().then(() => {
              // 将 fallback 语言添加到 i18n 实例
              const fallbackMsg = cache[FALLBACK_LOCALE]
              if (fallbackMsg && i18n) {
                i18n.global.setLocaleMessage(FALLBACK_LOCALE, fallbackMsg)
                if (import.meta.env.DEV) {
                  console.info(`[i18n] Fallback 语言 ${FALLBACK_LOCALE} 已动态加载`)
                }
              }
            })
          }
        }

        return key
      },
    })

    app.use(i18n)
    initDirection()
    setUrlLang(lang.value)
  }

  const setLanguage = async (newLang: string) => {
    language.value = newLang

    if (i18n) {
      const targetLang = lang.value
      const cache = getMessagesCache()

      // 如果目标语言还未加载，先加载
      if (!cache[targetLang]) {
        await loadMessage(targetLang)
        const newMessages = cache[targetLang]
        if (newMessages) {
          i18n.global.setLocaleMessage(targetLang, newMessages)
        }
      }

      // 切换语言
      ;(i18n.global as any).locale.value = targetLang
    }

    setUrlLang(lang.value)
  }

  const initDirection = () => {
    watchEffect(() => {
      const dir = isRTL.value ? 'rtl' : 'ltr'
      document.documentElement.setAttribute('dir', dir)
      document.documentElement.setAttribute('lang', lang.value)
    })
  }

  return { setupI18n, lang, isRTL, setLanguage }
}

export function useI18n() {
  if (!i18n) throw new Error('i18n未初始化')
  return {
    t: i18n.global.t as (key: string, ...args: any[]) => string,
  }
}
