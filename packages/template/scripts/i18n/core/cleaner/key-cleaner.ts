import path from 'path'
import { FileUtils } from '../utils/file-utils'
import { flattenJSON, unflattenJSON, removeKeys as removeKeysFromJSON } from '../utils/json-utils'
import { shouldBuildPage } from '../../../../config/pages'

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

  async scanUsedKeys(): Promise<Set<string>> {
    const usedKeys = new Set<string>()

    const files = await FileUtils.scanFiles(['**/*.{vue,ts,js}'], {
      cwd: this.srcPath,
      absolute: false,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/i18n/**'],
    })

    const regex = /(?:\$?t)\s*\(\s*([`'"])([\s\S]*?)\1/g

    for (const relativeFile of files) {
      const pageName = this.extractPageFromFilePath(relativeFile)

      if (!pageName || !shouldBuildPage(pageName)) {
        continue
      }

      const filePath = path.join(this.srcPath, relativeFile)
      const rawContent = await FileUtils.readFile(filePath)

      const content = this.removeComments(rawContent)

      let match
      while ((match = regex.exec(content)) !== null) {
        const key = match[2].trim()

        if (!key.startsWith('zh_') && key) {
          usedKeys.add(key)
        }
      }
    }

    return usedKeys
  }

  /**
   * 移除代码中的注释
   * 支持：单行注释 //、多行注释
   * 不支持：HTML 注释
   */
  private removeComments(code: string): string {
    let result = code

    // 移除多行注释 /* ... */
    result = result.replace(/\/\*[\s\S]*?\*\//g, '')

    // 移除 HTML/Vue 模板注释 <!-- ... -->
    result = result.replace(/<!--[\s\S]*?-->/g, '')

    // 移除单行注释 //（保留字符串中的 //）
    // 分行处理，避免影响字符串
    const lines = result.split('\n')
    result = lines
      .map((line) => {
        // 查找 // 的位置，但要排除在字符串中的情况
        let inString = false
        let stringChar = ''
        let commentStart = -1

        for (let i = 0; i < line.length - 1; i++) {
          const char = line[i]
          const nextChar = line[i + 1]

          // 处理字符串状态
          if ((char === '"' || char === "'" || char === '`') && line[i - 1] !== '\\') {
            if (!inString) {
              inString = true
              stringChar = char
            } else if (char === stringChar) {
              inString = false
              stringChar = ''
            }
          }

          // 检测 // 注释
          if (!inString && char === '/' && nextChar === '/') {
            commentStart = i
            break
          }
        }

        // 如果找到注释，截取注释前的部分
        if (commentStart !== -1) {
          return line.substring(0, commentStart)
        }

        return line
      })
      .join('\n')

    return result
  }

  async scanDefinedKeys(): Promise<Map<string, UsageInfo>> {
    const definedKeys = new Map<string, UsageInfo>()

    const jsonFiles = await FileUtils.scanFiles(['**/i18n/*.json'], {
      cwd: this.srcPath,
      absolute: false,
    })

    for (const relativeFile of jsonFiles) {
      const page = this.extractPage(relativeFile)

      if (!page || !shouldBuildPage(page)) {
        continue
      }

      const filePath = path.join(this.srcPath, relativeFile)
      const content = await FileUtils.readJSON(filePath)

      const flatKeys = flattenJSON(content)

      const lang = this.extractLang(relativeFile)

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

  private extractPage(filePath: string): string | null {
    const match = filePath.match(/([^/]+)\/i18n\/[a-z]{2,}\.json$/i)
    return match ? match[1] : null
  }

  private extractPageFromFilePath(filePath: string): string | null {
    const match = filePath.match(/^([^/\\]+)/)
    return match ? match[1] : null
  }
}
