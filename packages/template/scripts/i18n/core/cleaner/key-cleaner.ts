/**
 * Key 清理工具
 * 扫描未使用的翻译 key 并支持删除
 */

import path from 'path'
import { FileUtils } from '../utils/file-utils'
import { flattenJSON, unflattenJSON, removeKeys as removeKeysFromJSON } from '../utils/json-utils'

/**
 * Key 使用信息
 */
export interface UsageInfo {
  key: string // 完整 key 路径，如 "example.title"
  files: string[] // 定义在哪些 JSON 文件中
  languages: string[] // 哪些语种有这个 key
}

/**
 * 未使用的 Key 信息
 */
export interface UnusedKeyInfo {
  key: string
  definedIn: string[] // 文件路径（相对路径）
  languages: string[] // 语种列表
  page: string | null // 所属页面
}

/**
 * 删除结果
 */
export interface RemoveResult {
  filesUpdated: number
  keysRemoved: number
  affectedFiles: string[]
}

/**
 * Key 清理器
 */
export class KeyCleaner {
  private srcPath: string

  constructor(srcPath: string = './src/page') {
    this.srcPath = path.resolve(process.cwd(), srcPath)
  }

  /**
   * 扫描代码中实际使用的 key
   * 从 .vue/.ts/.js 文件中提取 t() 调用
   */
  async scanUsedKeys(): Promise<Set<string>> {
    const usedKeys = new Set<string>()

    // 扫描所有源代码文件
    const files = await FileUtils.scanFiles(['**/*.{vue,ts,js}'], {
      cwd: this.srcPath,
      absolute: false,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/i18n/**'],
    })

    // 正则匹配 t() 调用
    // 支持：t('key'), t("key"), t(`key`), $t('key')
    // 支持多行
    const regex = /(?:\$?t)\s*\(\s*([`'"])([\s\S]*?)\1/g

    for (const relativeFile of files) {
      const filePath = path.join(this.srcPath, relativeFile)
      const content = await FileUtils.readFile(filePath)

      let match
      while ((match = regex.exec(content)) !== null) {
        const key = match[2].trim()

        // 过滤 zh_ 占位符
        if (!key.startsWith('zh_') && key) {
          usedKeys.add(key)
        }
      }
    }

    return usedKeys
  }

  /**
   * 扫描所有语种 JSON 文件中定义的 key
   */
  async scanDefinedKeys(): Promise<Map<string, UsageInfo>> {
    const definedKeys = new Map<string, UsageInfo>()

    // 扫描所有 i18n/*.json 文件
    const jsonFiles = await FileUtils.scanFiles(['**/i18n/*.json'], {
      cwd: this.srcPath,
      absolute: false,
    })

    for (const relativeFile of jsonFiles) {
      const filePath = path.join(this.srcPath, relativeFile)
      const content = await FileUtils.readJSON(filePath)

      // 扁平化 JSON，获取所有 key 路径
      const flatKeys = flattenJSON(content)

      // 提取语种和页面信息
      const lang = this.extractLang(relativeFile)
      const page = this.extractPage(relativeFile)

      // 记录每个 key 的定义位置
      for (const key of Object.keys(flatKeys)) {
        if (!definedKeys.has(key)) {
          definedKeys.set(key, {
            key,
            files: [],
            languages: [],
          })
        }

        const info = definedKeys.get(key)!
        info.files.push(relativeFile)

        if (!info.languages.includes(lang)) {
          info.languages.push(lang)
        }
      }
    }

    return definedKeys
  }

  /**
   * 找出未使用的 key
   */
  async findUnusedKeys(): Promise<UnusedKeyInfo[]> {
    const usedKeys = await this.scanUsedKeys()
    const definedKeys = await this.scanDefinedKeys()

    const unusedKeys: UnusedKeyInfo[] = []

    for (const [key, info] of definedKeys.entries()) {
      if (!usedKeys.has(key)) {
        unusedKeys.push({
          key,
          definedIn: info.files,
          languages: info.languages.sort(),
          page: this.extractPage(info.files[0]),
        })
      }
    }

    // 按页面和 key 排序
    return unusedKeys.sort((a, b) => {
      const pageCompare = (a.page || '').localeCompare(b.page || '')
      if (pageCompare !== 0) return pageCompare
      return a.key.localeCompare(b.key)
    })
  }

  /**
   * 从所有语种 JSON 中删除指定的 keys
   */
  async removeKeys(keysToRemove: string[]): Promise<RemoveResult> {
    if (keysToRemove.length === 0) {
      return {
        filesUpdated: 0,
        keysRemoved: 0,
        affectedFiles: [],
      }
    }

    // 找出受影响的文件
    const definedKeys = await this.scanDefinedKeys()
    const affectedFilesSet = new Set<string>()

    for (const key of keysToRemove) {
      const info = definedKeys.get(key)
      if (info) {
        info.files.forEach((f) => affectedFilesSet.add(f))
      }
    }

    const affectedFiles = Array.from(affectedFilesSet)

    // 按文件处理
    for (const relativeFile of affectedFiles) {
      const filePath = path.join(this.srcPath, relativeFile)

      // 读取 JSON
      const content = await FileUtils.readJSON(filePath)

      // 删除指定的 keys
      const updatedContent = removeKeysFromJSON(content, keysToRemove)

      // 写回文件
      await FileUtils.writeJSON(filePath, updatedContent, 2)
    }

    return {
      filesUpdated: affectedFiles.length,
      keysRemoved: keysToRemove.length,
      affectedFiles: affectedFiles.map((f) =>
        path.relative(process.cwd(), path.join(this.srcPath, f))
      ),
    }
  }

  /**
   * 从文件路径提取语种代码
   * 例如：page/example/i18n/en.json -> en
   */
  private extractLang(filePath: string): string {
    const match = filePath.match(/i18n\/([a-z]{2,})\.json$/i)
    return match ? match[1] : 'unknown'
  }

  /**
   * 从文件路径提取页面名称
   * 例如：page/example/i18n/en.json -> example
   */
  private extractPage(filePath: string): string | null {
    const match = filePath.match(/([^/]+)\/i18n\/[a-z]{2,}\.json$/i)
    return match ? match[1] : null
  }
}
