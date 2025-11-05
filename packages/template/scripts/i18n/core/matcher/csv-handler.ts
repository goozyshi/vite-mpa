import Papa from 'papaparse'
import fse from 'fs-extra'
import path from 'path'
import { FileUtils } from '../utils/file-utils'

/**
 * CSV 处理器
 * 负责 CSV 文件的解析和数据提取
 */
export class CSVHandler {
  /**
   * 解析单个 CSV 文件
   */
  static async parse(filePath: string): Promise<any[]> {
    const content = await fse.readFile(filePath, 'utf-8')

    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          resolve(results.data as any[])
        },
        error: (error) => {
          reject(error)
        },
      })
    })
  }

  /**
   * 从目录加载所有 CSV 文件
   * 返回 Map<中文内容, 翻译行>
   */
  static async loadFromDirectory(
    dir: string,
    zhColumnNames: string[] = ['中文（zh）', '中文', 'zh', 'Chinese']
  ): Promise<Map<string, any>> {
    const translationMap = new Map<string, any>()

    // 使用 fast-glob 扫描 CSV 文件
    const csvFiles = await FileUtils.scanFiles('**/*.csv', {
      cwd: dir,
      absolute: true,
    })

    console.log(`📦 加载 CSV 文件: ${csvFiles.length} 个`)

    for (const file of csvFiles) {
      try {
        const rows = await this.parse(file)

        rows.forEach((row) => {
          // 查找中文列
          const zhText = this.findValue(row, zhColumnNames)

          if (zhText && zhText.trim()) {
            // 使用中文内容作为 key
            translationMap.set(zhText.trim(), row)
          }
        })
      } catch (error) {
        console.warn(`⚠️  解析 CSV 失败: ${path.basename(file)}`, error)
      }
    }

    return translationMap
  }

  /**
   * 查找列值（支持多种列名）
   */
  static findValue(row: any, possibleNames: string[]): string | null {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null) {
        return String(row[name]).trim()
      }
    }
    return null
  }

  /**
   * 查找列索引
   */
  static findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const index = headers.findIndex((h) => h === name)
      if (index !== -1) {
        return index
      }
    }
    return -1
  }
}

