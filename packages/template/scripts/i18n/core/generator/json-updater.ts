import path from 'path'
import { FileUtils } from '../utils/file-utils'
import { flattenJSON, unflattenJSON } from '../utils/json-utils'
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
      // 获取该页面所有现有的语种文件
      const existingLangs = await this.getExistingLanguages(pagePath)

      // 检查缺失的翻译并警告
      this.checkMissingTranslations(pageTasks, existingLangs, pagePath)

      // 按语种分组
      const langUpdates = this.groupByLanguage(pageTasks)

      // 🎯 只更新实际存在的语种文件（避免处理未接入的语种）
      for (const lang of existingLangs) {
        const updates = langUpdates[lang]
        if (!updates || Object.keys(updates).length === 0) {
          continue // 跳过没有更新的语种
        }

        const updated = await this.updateLangFile(pagePath, lang, updates)
        if (updated) {
          filesUpdated++
          keysAdded += Object.keys(updates).length
        }
      }
    }

    return { filesUpdated, keysAdded }
  }

  /**
   * 获取页面现有的所有语种
   */
  private async getExistingLanguages(pagePath: string): Promise<string[]> {
    const i18nDir = path.join(pagePath, 'i18n')

    // 检查i18n目录是否存在
    if (!(await FileUtils.exists(i18nDir))) {
      return []
    }

    // 扫描所有.json文件
    const files = await FileUtils.scanFiles(['*.json'], {
      cwd: i18nDir,
      absolute: false,
    })

    // 提取语种代码（文件名去掉.json）
    return files.map((file) => path.basename(file, '.json')).sort()
  }

  /**
   * 检查并警告缺失的翻译
   */
  private checkMissingTranslations(
    tasks: UpdateTask[],
    existingLangs: string[],
    pagePath: string
  ): void {
    const missingMap = new Map<string, Set<string>>() // key -> 缺失的语种

    for (const task of tasks) {
      const providedLangs = Object.keys(task.translations)
      const missingLangs = existingLangs.filter((lang) => !providedLangs.includes(lang))

      if (missingLangs.length > 0) {
        missingMap.set(task.key, new Set(missingLangs))
      }
    }

    // 输出警告
    if (missingMap.size > 0) {
      console.log(
        `\n⚠️  ${path.relative(process.cwd(), pagePath)} 发现 ${missingMap.size} 个 key 缺少翻译：`
      )

      for (const [key, langs] of Array.from(missingMap.entries())) {
        console.log(`   - ${key}: 缺少 ${Array.from(langs).join(', ')} 语种的翻译`)
      }

      console.log(`\n💡 提示: 请在 CSV 文件中补充缺失的翻译，然后重新导入\n`)
    }
  }

  /**
   * 更新单个语种文件
   * @returns 是否实际更新了文件
   */
  private async updateLangFile(
    pagePath: string,
    lang: string,
    updates: Record<string, string>
  ): Promise<boolean> {
    const filePath = path.join(pagePath, 'i18n', `${lang}.json`)

    // 检查文件是否存在
    const fileExists = await FileUtils.exists(filePath)
    if (!fileExists) {
      console.log(
        `⏭️  跳过: ${path.relative(process.cwd(), filePath)} (文件不存在，仅更新现有语种)`
      )
      return false
    }

    // 读取现有数据（嵌套结构）
    const existing = await FileUtils.readJSON(filePath)

    // 扁平化现有数据
    const flatExisting = flattenJSON(existing)

    // 合并数据（扁平结构）
    const merged = { ...flatExisting, ...updates }

    // 排序 keys
    const sortedFlat = this.sortKeys(merged)

    // 反扁平化为嵌套结构
    const nested = unflattenJSON(sortedFlat)

    // 写入文件
    await FileUtils.writeJSON(filePath, nested, 2)

    console.log(
      `✅ 更新: ${path.relative(process.cwd(), filePath)} (+${Object.keys(updates).length} keys)`
    )

    return true
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
