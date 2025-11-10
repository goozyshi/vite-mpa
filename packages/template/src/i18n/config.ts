/**
 * 多语言配置 - 统一管理所有语种
 *
 * ⚠️ 这是语种配置的唯一真相来源
 * - 前端根据 enabled 过滤可用语种
 * - 工具根据 csvColumns 匹配 CSV
 */

/**
 * 语种完整配置
 */
export interface LanguageConfig {
  /** 语种代码（ISO 639-1） */
  code: string
  /** 语种英文名称 */
  name: string
  /** 语种本地化名称（用于 UI 显示） */
  label: string
  /** 文本方向 */
  dir: 'ltr' | 'rtl'
  /** CSV 列名映射（用于导入工具） */
  csvColumns: string[]
  /** 是否已启用（在前端展示） */
  enabled: boolean
}

/**
 * 所有支持的语种配置
 *
 * ⚠️ 这是语种配置的唯一真相来源
 */
export const ALL_LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    label: 'English',
    dir: 'ltr',
    csvColumns: ['English(en)', 'English', 'en'],
    enabled: true,
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    label: '中文',
    dir: 'ltr',
    csvColumns: ['中文（zh）', '中文', 'zh'],
    enabled: true,
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    label: 'العربية',
    dir: 'rtl',
    csvColumns: ['Arabic(ar)', 'Arabic', 'ar'],
    enabled: true,
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    label: 'Türkçe',
    dir: 'ltr',
    csvColumns: ['Turkish', 'turkish', '土耳其语', 'tr'],
    enabled: false,
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    label: 'हिंदी',
    dir: 'ltr',
    csvColumns: ['hindi', 'Hindi', '印地语', 'hi'],
    enabled: false,
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    label: 'ਪੰਜਾਬੀ',
    dir: 'ltr',
    csvColumns: ['punjabi', 'Punjabi', '旁遮普语', 'pa'],
    enabled: false,
  },
}

// ==================== 派生配置（自动生成） ====================

/**
 * 已启用的语种代码列表（自动生成）
 */
export const SUPPORTED_LOCALES = Object.values(ALL_LANGUAGES)
  .filter((lang) => lang.enabled)
  .map((lang) => lang.code)

export type LangType = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: LangType = 'en' as LangType

export const FALLBACK_LOCALE: LangType = 'en' as LangType

/**
 * 已启用的语种配置（用于前端 UI，自动生成）
 */
export const LOCALE_CONFIG: Record<
  string,
  {
    name: string
    label: string
    dir: 'ltr' | 'rtl'
  }
> = Object.fromEntries(
  Object.values(ALL_LANGUAGES)
    .filter((lang) => lang.enabled)
    .map((lang) => [
      lang.code,
      {
        name: lang.name,
        label: lang.label,
        dir: lang.dir,
      },
    ])
)

/**
 * RTL 语种列表（自动生成）
 */
export const RTL_LOCALES: string[] = Object.values(ALL_LANGUAGES)
  .filter((lang) => lang.enabled && lang.dir === 'rtl')
  .map((lang) => lang.code)

export function isRTLLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale)
}

// ==================== 工具函数 ====================

/**
 * 获取语种的 CSV 列名映射
 * @param langCode 语种代码
 * @returns CSV 列名数组，未找到则返回空数组
 */
export function getCSVColumns(langCode: string): string[] {
  return ALL_LANGUAGES[langCode]?.csvColumns || []
}

/**
 * 检查语种是否已配置
 * @param langCode 语种代码
 */
export function isLanguageConfigured(langCode: string): boolean {
  return langCode in ALL_LANGUAGES
}

/**
 * 检查语种是否已启用
 * @param langCode 语种代码
 */
export function isLanguageEnabled(langCode: string): boolean {
  return ALL_LANGUAGES[langCode]?.enabled === true
}

/**
 * 获取所有已配置的语种代码
 */
export function getAllConfiguredLanguages(): string[] {
  return Object.keys(ALL_LANGUAGES)
}
