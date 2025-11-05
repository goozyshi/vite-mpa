import { CSVHandler } from './csv-handler'
import { PlaceholderProcessor, PlaceholderRule, defaultPlaceholderRules } from './placeholder'
import type { ZhPlaceholder } from '../scanner/zh-scanner'

/**
 * 匹配的翻译项
 */
export interface MatchedTranslation {
  zhText: string
  key: string
  translations: Record<string, string> // { zh, en, ar, tr }
  filePath: string
  line: number
  pageName: string
  hasNamedPlaceholder: boolean
  warnings: string[]
}

/**
 * 匹配结果
 */
export interface MatchResult {
  matched: MatchedTranslation[]
  unmatched: ZhPlaceholder[]
  stats: {
    total: number
    matchedCount: number
    unmatchedCount: number
    matchRate: string
    namedPlaceholderCount: number
  }
}

/**
 * CSV 匹配器
 * 负责将 zh_ 占位符与 CSV 翻译匹配
 */
export class CSVMatcher {
  private csvDir: string
  private processor: PlaceholderProcessor
  private translationMap: Map<string, any> | null = null

  constructor(options: { csvDir: string; placeholderRules?: PlaceholderRule[] }) {
    this.csvDir = options.csvDir
    this.processor = new PlaceholderProcessor(
      options.placeholderRules || defaultPlaceholderRules
    )
  }

  /**
   * 匹配 zh_ 占位符
   */
  async match(placeholders: ZhPlaceholder[]): Promise<MatchResult> {
    // 加载 CSV
    if (!this.translationMap) {
      console.log('📦 加载 CSV 翻译数据...')
      this.translationMap = await CSVHandler.loadFromDirectory(this.csvDir)
      console.log(`✅ 加载完成，共 ${this.translationMap.size} 条翻译`)
    }

    const matched: MatchedTranslation[] = []
    const unmatched: ZhPlaceholder[] = []
    let namedPlaceholderCount = 0

    for (const placeholder of placeholders) {
      const csvRow = this.translationMap.get(placeholder.zhText)

      if (csvRow && csvRow.key) {
        // 匹配成功，提取各语种翻译
        const translations: Record<string, string> = {}
        const warnings: string[] = []
        let hasNamedPlaceholder = false

        // 提取并处理各语种
        const languages = ['zh', 'en', 'ar', 'tr', 'hi', 'pa']
        const columnMappings: Record<string, string[]> = {
          zh: ['中文（zh）', '中文', 'zh'],
          en: ['English(en)', 'English', 'en'],
          ar: ['Arabic(ar)', 'Arabic', 'ar'],
          tr: ['Turkish', 'turkish', '土耳其语', 'tr'],
          hi: ['hindi', 'Hindi', '印地语', 'hi'],
          pa: ['punjabi', 'Punjabi', '旁遮普语', 'pa'],
        }

        for (const lang of languages) {
          const value = CSVHandler.findValue(csvRow, columnMappings[lang] || [lang])
          if (value) {
            const processed = this.processor.process(value)
            translations[lang] = processed.text

            if (processed.hasNamedPlaceholder) {
              hasNamedPlaceholder = true
            }

            warnings.push(...processed.warnings)
          }
        }

        if (hasNamedPlaceholder) {
          namedPlaceholderCount++
        }

        matched.push({
          zhText: placeholder.zhText,
          key: csvRow.key,
          translations,
          filePath: placeholder.filePath,
          line: placeholder.line,
          pageName: placeholder.pageName,
          hasNamedPlaceholder,
          warnings,
        })
      } else {
        // 未匹配
        unmatched.push(placeholder)
      }
    }

    const total = placeholders.length
    const matchedCount = matched.length
    const unmatchedCount = unmatched.length

    return {
      matched,
      unmatched,
      stats: {
        total,
        matchedCount,
        unmatchedCount,
        matchRate: total > 0 ? ((matchedCount / total) * 100).toFixed(1) : '0',
        namedPlaceholderCount,
      },
    }
  }

  /**
   * 匹配新语种（用于 add-lang 命令）
   */
  async matchNewLang(
    keys: string[],
    targetLang: string
  ): Promise<{
    total: number
    matched: number
    unmatched: number
    matchRate: string
    matchedList: Array<{ key: string; translation: string }>
    unmatchedList: string[]
  }> {
    // 加载 CSV
    if (!this.translationMap) {
      this.translationMap = await CSVHandler.loadFromDirectory(this.csvDir)
    }

    const columnNames = this.getColumnNames(targetLang)
    const matchedList: Array<{ key: string; translation: string }> = []
    const unmatchedList: string[] = []

    // 构建 key -> row 的映射
    const keyMap = new Map<string, any>()
    for (const [, row] of this.translationMap) {
      if (row.key) {
        keyMap.set(row.key, row)
      }
    }

    for (const key of keys) {
      const row = keyMap.get(key)

      if (row) {
        const value = CSVHandler.findValue(row, columnNames)

        if (value) {
          const processed = this.processor.process(value)
          matchedList.push({
            key,
            translation: processed.text,
          })
        } else {
          unmatchedList.push(key)
        }
      } else {
        unmatchedList.push(key)
      }
    }

    const total = keys.length
    const matched = matchedList.length
    const unmatched = unmatchedList.length

    return {
      total,
      matched,
      unmatched,
      matchRate: total > 0 ? ((matched / total) * 100).toFixed(1) : '0',
      matchedList,
      unmatchedList,
    }
  }

  /**
   * 获取语种对应的列名
   */
  private getColumnNames(lang: string): string[] {
    const mappings: Record<string, string[]> = {
      zh: ['中文（zh）', '中文', 'zh'],
      en: ['English(en)', 'English', 'en'],
      ar: ['Arabic(ar)', 'Arabic', 'ar'],
      tr: ['Turkish', 'turkish', '土耳其语', 'tr'],
      hi: ['hindi', 'Hindi', '印地语', 'hi'],
      pa: ['punjabi', 'Punjabi', '旁遮普语', 'pa'],
    }

    return mappings[lang] || [lang]
  }
}

