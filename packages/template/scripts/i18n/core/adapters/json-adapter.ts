/**
 * JSON 格式适配器
 * 用于读写 .json 格式的翻译文件
 */

import { FormatAdapter } from './format-adapter'
import { FileUtils } from '../utils/file-utils'

export class JSONFormatAdapter implements FormatAdapter {
  /**
   * 读取 JSON 翻译文件
   */
  async read(filePath: string): Promise<Record<string, any>> {
    return await FileUtils.readJSON(filePath)
  }

  /**
   * 写入 JSON 翻译文件
   */
  async write(filePath: string, data: Record<string, any>): Promise<void> {
    await FileUtils.writeJSON(filePath, data, 2)
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(): string {
    return '.json'
  }

  /**
   * 格式化为 JSON 字符串
   */
  format(data: Record<string, any>): string {
    return JSON.stringify(data, null, 2)
  }
}
