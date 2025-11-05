/**
 * TypeScript 对象格式适配器
 * 用于读写 .ts 格式的翻译文件
 *
 * 格式示例：
 * export default {
 *   common: {
 *     ok: 'OK',
 *     cancel: 'Cancel'
 *   }
 * }
 *
 * ⚠️ 当前为预留实现，未来扩展时需要完善
 */

import { FormatAdapter } from './format-adapter'
import { FileUtils } from '../utils/file-utils'

export class TSObjectFormatAdapter implements FormatAdapter {
  /**
   * 读取 TS 对象文件
   * ⚠️ 当前为简化实现，未来需要使用 AST 解析
   */
  async read(filePath: string): Promise<Record<string, any>> {
    // TODO: 实现 TS 文件解析
    // 可以使用 @babel/parser 或 typescript compiler API
    throw new Error('TS Object format is not implemented yet')
  }

  /**
   * 写入 TS 对象文件
   */
  async write(filePath: string, data: Record<string, any>): Promise<void> {
    const content = this.format(data)
    await FileUtils.writeFile(filePath, content)
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(): string {
    return '.ts'
  }

  /**
   * 格式化为 TS 对象代码
   */
  format(data: Record<string, any>): string {
    const formatted = this.formatObject(data, 0)
    return `export default ${formatted}\n`
  }

  /**
   * 递归格式化对象
   */
  private formatObject(obj: any, indent: number): string {
    const indentStr = '  '.repeat(indent)
    const nextIndentStr = '  '.repeat(indent + 1)

    if (typeof obj !== 'object' || obj === null) {
      return JSON.stringify(obj)
    }

    const lines: string[] = ['{']

    for (const [key, value] of Object.entries(obj)) {
      const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const formattedValue = this.formatObject(value, indent + 1)
        lines.push(`${nextIndentStr}${formattedKey}: ${formattedValue},`)
      } else {
        const formattedValue = JSON.stringify(value)
        lines.push(`${nextIndentStr}${formattedKey}: ${formattedValue},`)
      }
    }

    lines.push(`${indentStr}}`)
    return lines.join('\n')
  }
}
