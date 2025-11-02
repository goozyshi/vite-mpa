import { ref, computed, watchEffect } from 'vue'
import { createI18n } from 'vue-i18n'
import type { App } from 'vue'
import { loadMessages, type PageI18nConfig } from '@/i18n'
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

const language = ref<string>(getInitialLanguage())

const lang = computed<LangType>(() => {
  const lowerLang = language.value?.toLowerCase() || ''
  if (lowerLang.indexOf('zh') > -1) return 'zh'
  if (lowerLang.indexOf('ar') > -1) return 'ar'
  if (lowerLang.indexOf('en') > -1) return 'en'
  return DEFAULT_LOCALE
})

const isRTL = computed(() => isRTLLocale(lang.value))

let i18n: ReturnType<typeof createI18n>

export function useLang() {
  const setupI18n = async (app: App, pageI18n: PageI18nConfig) => {
    const messages = await loadMessages(pageI18n)

    i18n = createI18n({
      locale: lang.value,
      fallbackLocale: FALLBACK_LOCALE,
      messages,
      legacy: false,
      missingWarn: import.meta.env.DEV,
      fallbackWarn: import.meta.env.DEV,
    })

    app.use(i18n)
    initDirection()
    setUrlLang(lang.value)
  }

  const setLanguage = (newLang: string) => {
    language.value = newLang
    if (i18n) {
      ;(i18n.global as any).locale.value = lang.value
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
