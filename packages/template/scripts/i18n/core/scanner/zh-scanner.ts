import path from 'path'
import { FileUtils } from '../utils/file-utils'
import { shouldBuildPage } from '../../../../config/pages'

/**
 * zh_ 占位符信息
 */
export interface ZhPlaceholder {
  zhText: string // "确认"
  placeholder: string // "zh_确认"
  filePath: string // "src/page/vip/pages/Home.vue"
  line: number
  column: number
  suggestedKey: string // "com_confirm"
  pageName: string // "vip"
}

/**
 * 快速扫描结果
 */
export interface QuickScanResult {
  count: number
  files: string[]
  pages: Map<string, number> // 页面 -> 数量
}

/**
 * zh_ 占位符扫描器
 * 负责扫描代码中的 zh_ 占位符
 */
export class ZhScanner {
  private srcPath: string

  constructor(options: { srcPath: string }) {
    this.srcPath = options.srcPath
  }

  /**
   * 完整扫描（详细信息）
   */
  async scan(): Promise<ZhPlaceholder[]> {
    const results: ZhPlaceholder[] = []

    // 使用 fast-glob 扫描所有相关文件
    const files = await FileUtils.scanFiles(['**/*.vue', '**/*.ts', '**/*.js'], {
      cwd: this.srcPath,
      absolute: false,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    })

    for (const relativeFile of files) {
      // 🔍 根据 pages.ts 配置过滤页面
      const pageName = this.extractPageName(relativeFile)

      // 如果没有页面名或不应该构建，跳过
      if (!pageName || !shouldBuildPage(pageName)) {
        continue
      }

      const filePath = path.join(this.srcPath, relativeFile)
      const content = await FileUtils.readFile(filePath)

      const matches = this.extractZhPlaceholders(content, filePath)
      results.push(...matches)
    }

    return results
  }

  /**
   * 快速扫描（只统计，不提取详情）
   * 用于启动时的快速检测
   */
  async quickScan(): Promise<QuickScanResult> {
    const files = await FileUtils.scanFiles(['**/*.{vue,ts,js}'], {
      cwd: this.srcPath,
      absolute: false,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    })

    let totalCount = 0
    const affectedFiles: string[] = []
    const pageStats = new Map<string, number>()

    for (const relativeFile of files) {
      // 🔍 根据 pages.ts 配置过滤页面
      const pageName = this.extractPageName(relativeFile)

      // 如果没有页面名或不应该构建，跳过
      if (!pageName || !shouldBuildPage(pageName)) {
        continue
      }

      const filePath = path.join(this.srcPath, relativeFile)
      const content = await FileUtils.readFile(filePath)

      // 快速正则检测
      const matches = content.match(/[$]?t\([`'"]zh_/g)

      if (matches && matches.length > 0) {
        affectedFiles.push(relativeFile)
        totalCount += matches.length

        // 统计页面
        pageStats.set(pageName, (pageStats.get(pageName) || 0) + matches.length)
      }
    }

    return {
      count: totalCount,
      files: affectedFiles,
      pages: pageStats,
    }
  }

  /**
   * 提取文件中的所有 zh_ 占位符
   */
  private extractZhPlaceholders(content: string, filePath: string): ZhPlaceholder[] {
    const results: ZhPlaceholder[] = []

    // 匹配 t("zh_xxx") 或 $t('zh_xxx') 或 t(`zh_xxx`)
    // 支持多行和参数
    // [\s\S] 用于匹配任意字符（包括换行符）
    const regex = /(?:[$]?t)\s*\(\s*([`'"])zh_([\s\S]*?)\1(?:\s*,\s*([\s\S]*?))?\s*\)/g

    let match
    while ((match = regex.exec(content)) !== null) {
      const zhText = match[2]
      const position = this.getPosition(content, match.index)
      const pageName = this.extractPageName(filePath)

      results.push({
        zhText,
        placeholder: `zh_${zhText}`,
        filePath: path.relative(process.cwd(), filePath),
        line: position.line,
        column: position.column,
        suggestedKey: this.generateKey(zhText, pageName),
        pageName: pageName || 'unknown',
      })
    }

    return results
  }

  /**
   * 获取位置信息（行号、列号）
   */
  private getPosition(content: string, index: number): { line: number; column: number } {
    const lines = content.substring(0, index).split('\n')
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    }
  }

  /**
   * 从文件路径提取页面名称
   * 因为 cwd 设置为 srcPath (./src/page)，
   * 所以相对路径是 example/pages/Home.vue 而不是 page/example/pages/Home.vue
   * 直接提取第一个路径段即可
   * 例如: example/pages/Home.vue -> example
   */
  private extractPageName(filePath: string): string | null {
    // 提取第一个路径段作为页面名
    const match = filePath.match(/^([^/\\]+)/)
    return match ? match[1] : null
  }

  /**
   * 生成建议的 key 名称
   * 简单实现：使用页面名 + 简化的中文
   */
  private generateKey(zhText: string, pageName: string | null): string {
    // 简化版：可以后续集成拼音库
    const prefix = pageName ? `${pageName}_` : 'com_'
    const simplifiedText = zhText
      .substring(0, 20)
      .replace(/[^\w\u4e00-\u9fa5]/g, '_')
      .toLowerCase()

    return `${prefix}${simplifiedText}`
  }
}
