import { FileUtils } from '../utils/file-utils'
import type { MatchedTranslation } from '../matcher/csv-matcher'

/**
 * 替换任务
 */
export interface ReplaceTask {
  filePath: string
  replacements: Array<{
    from: string // 'zh_确认'
    to: string // 'com_confirm'
    line: number
  }>
}

/**
 * 代码替换器
 * 负责替换代码中的 zh_ 占位符为真实 key
 */
export class CodeReplacer {
  /**
   * 批量替换
   */
  async replace(tasks: ReplaceTask[]): Promise<{
    filesUpdated: number
    replacements: number
  }> {
    let filesUpdated = 0
    let totalReplacements = 0

    for (const task of tasks) {
      const count = await this.replaceInFile(task.filePath, task.replacements)

      if (count > 0) {
        filesUpdated++
        totalReplacements += count
        console.log(`✅ 替换: ${task.filePath} (${count} 处)`)
      }
    }

    return { filesUpdated, replacements: totalReplacements }
  }

  /**
   * 替换单个文件
   */
  private async replaceInFile(
    filePath: string,
    replacements: Array<{ from: string; to: string }>
  ): Promise<number> {
    let content = await FileUtils.readFile(filePath)
    let count = 0

    for (const { from, to } of replacements) {
      // 构建正则：匹配 t("zh_xxx") 或 $t('zh_xxx')
      // 保留引号类型和参数
      const escapedFrom = this.escapeRegex(from)

      // 匹配模式：
      // ($?t\()  - 匹配 t( 或 $t(
      // (['"`])  - 匹配引号并捕获
      // zh_xxx   - 匹配占位符
      // \2       - 匹配相同的引号
      // ([\s\S]*?)  - 匹配可能的参数（支持多行）
      // \)       - 匹配结束括号
      const pattern = new RegExp(`([$]?t\\s*\\()(['"\`])${escapedFrom}\\2([\\s\\S]*?)\\)`, 'g')

      const newContent = content.replace(pattern, (match, prefix, quote, params) => {
        count++
        return `${prefix}${quote}${to}${quote}${params})`
      })

      content = newContent
    }

    if (count > 0) {
      await FileUtils.writeFile(filePath, content)
    }

    return count
  }

  /**
   * 转义正则特殊字符
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

/**
 * 从 MatchedTranslation 转换为 ReplaceTask
 */
export function convertToReplaceTasks(matched: MatchedTranslation[]): ReplaceTask[] {
  // 按文件分组
  const grouped = matched.reduce(
    (acc, item) => {
      if (!acc[item.filePath]) {
        acc[item.filePath] = []
      }
      acc[item.filePath].push({
        from: item.placeholder,
        to: item.key,
        line: item.line,
      })
      return acc
    },
    {} as Record<string, Array<{ from: string; to: string; line: number }>>
  )

  // 转换为 ReplaceTask
  return Object.entries(grouped).map(([filePath, replacements]) => ({
    filePath,
    replacements,
  }))
}
