import path from 'path'
import { FileUtils } from '../utils/file-utils'
import type { MatchedTranslation } from '../matcher/csv-matcher'

/**
 * 更新任务
 */
export interface UpdateTask {
  pagePath: string // src/page/vip
  key: string // com_confirm
  translations: Record<string, string> // { zh, en, ar }
}

/**
 * JSON 更新器
 * 负责更新页面的翻译 JSON 文件
 */
export class JSONUpdater {
  /**
   * 批量更新翻译
   */
  async update(tasks: UpdateTask[]): Promise<{
    filesUpdated: number
    keysAdded: number
  }> {
    // 按页面分组
    const grouped = this.groupByPage(tasks)

    let filesUpdated = 0
    let keysAdded = 0

    for (const [pagePath, pageTasks] of Object.entries(grouped)) {
      // 按语种分组
      const langUpdates = this.groupByLanguage(pageTasks)

      for (const [lang, updates] of Object.entries(langUpdates)) {
        await this.updateLangFile(pagePath, lang, updates)
        filesUpdated++
        keysAdded += Object.keys(updates).length
      }
    }

    return { filesUpdated, keysAdded }
  }

  /**
   * 更新单个语种文件
   */
  private async updateLangFile(
    pagePath: string,
    lang: string,
    updates: Record<string, string>
  ): Promise<void> {
    const filePath = path.join(pagePath, 'i18n', `${lang}.json`)

    // 读取现有数据
    const existing = await FileUtils.readJSON<Record<string, string>>(filePath)

    // 合并数据
    const merged = { ...existing, ...updates }

    // 排序 keys
    const sorted = this.sortKeys(merged)

    // 写入文件
    await FileUtils.writeJSON(filePath, sorted, 2)

    console.log(
      `✅ 更新: ${path.relative(process.cwd(), filePath)} (+${Object.keys(updates).length} keys)`
    )
  }

  /**
   * 按页面分组
   */
  private groupByPage(tasks: UpdateTask[]): Record<string, UpdateTask[]> {
    return tasks.reduce(
      (acc, task) => {
        if (!acc[task.pagePath]) {
          acc[task.pagePath] = []
        }
        acc[task.pagePath].push(task)
        return acc
      },
      {} as Record<string, UpdateTask[]>
    )
  }

  /**
   * 按语种分组
   */
  private groupByLanguage(tasks: UpdateTask[]): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {}

    for (const task of tasks) {
      for (const [lang, translation] of Object.entries(task.translations)) {
        if (!result[lang]) {
          result[lang] = {}
        }
        result[lang][task.key] = translation
      }
    }

    return result
  }

  /**
   * 排序 keys（保持一致性）
   */
  private sortKeys<T extends Record<string, any>>(obj: T): T {
    const sorted = {} as T
    const keys = Object.keys(obj).sort()

    for (const key of keys) {
      sorted[key as keyof T] = obj[key]
    }

    return sorted
  }
}

/**
 * 从 MatchedTranslation 转换为 UpdateTask
 */
export function convertToUpdateTasks(
  matched: MatchedTranslation[],
  srcPath: string = './src/page'
): UpdateTask[] {
  return matched.map((item) => ({
    pagePath: path.join(srcPath, item.pageName),
    key: item.key,
    translations: item.translations,
  }))
}

