import type { PlaceholderRule } from '../scripts/i18n/core/matcher/placeholder'

/**
 * i18n 工具配置
 */
export interface I18nConfig {
  /**
   * 翻译文件格式
   * - 'json': 单语种 JSON 文件（默认）
   * - 'ts-object': TS 对象格式（预留扩展）
   */
  format: 'json' | 'ts-object'

  /**
   * JSON 格式配置
   */
  json?: {
    /** 文件路径模板 */
    filePattern: string // 'i18n/{lang}.json'
    /** 是否美化输出 */
    prettify: boolean
    /** 缩进空格数 */
    indent: number
  }

  /**
   * TS 对象格式配置（预留扩展）
   */
  tsObject?: {
    /** 文件路径 */
    filePath: string // 'lang.ts'
    /** 变量名 */
    variableName: string // 'allLang'
    /** 是否导出类型 */
    exportTypes: boolean
  }

  /**
   * 占位符规则
   */
  placeholderRules: PlaceholderRule[]

  /**
   * CSV 配置
   */
  csv: {
    directory: string
    columnMapping: Record<string, string[]>
  }

  /**
   * 源码路径
   */
  srcPath: string
}

/**
 * 默认配置
 */
export const defaultI18nConfig: I18nConfig = {
  format: 'json',

  json: {
    filePattern: 'i18n/{lang}.json',
    prettify: true,
    indent: 2,
  },

  placeholderRules: [
    {
      pattern: /%([A-Z]{2})/g,
      replacer: (match, letters) => {
        const index = letters.charCodeAt(0) - 65 // A=65
        return `{${index}}`
      },
      description: 'CSV 占位符转换: %AA -> {0}',
    },
    {
      pattern: /@/g,
      replacer: "{'@'}",
      description: "特殊字符转义: @ -> {'@'}",
    },
    {
      pattern: /#/g,
      replacer: "{'#'}",
      description: "特殊字符转义: # -> {'#'}",
    },
  ],

  csv: {
    directory: './translations',
    columnMapping: {
      key: ['key', 'Key', '键'],
      zh: ['中文（zh）', '中文', 'zh'],
      en: ['English(en)', 'English', 'en'],
      ar: ['Arabic(ar)', 'Arabic', 'ar'],
      tr: ['Turkish', 'turkish', '土耳其语', 'tr'],
      hi: ['hindi', 'Hindi', '印地语', 'hi'],
      pa: ['punjabi', 'Punjabi', '旁遮普语', 'pa'],
    },
  },

  srcPath: './src/page',
}

