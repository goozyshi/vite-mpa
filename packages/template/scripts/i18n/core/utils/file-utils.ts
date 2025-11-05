import fse from 'fs-extra'
import path from 'path'
import fg from 'fast-glob'

/**
 * 文件工具类
 * 统一封装文件操作，使用 fs-extra 和 fast-glob
 */
export class FileUtils {
  /**
   * 确保目录存在
   */
  static async ensureDir(dirPath: string): Promise<void> {
    await fse.ensureDir(dirPath)
  }

  /**
   * 读取 JSON 文件
   */
  static async readJSON<T = any>(filePath: string): Promise<T> {
    try {
      return await fse.readJSON(filePath)
    } catch {
      return {} as T
    }
  }

  /**
   * 写入 JSON 文件（美化格式）
   */
  static async writeJSON(
    filePath: string,
    data: any,
    indent: number = 2
  ): Promise<void> {
    await fse.ensureDir(path.dirname(filePath))
    await fse.writeJSON(filePath, data, { spaces: indent })
  }

  /**
   * 读取文本文件
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      return await fse.readFile(filePath, 'utf-8')
    } catch {
      return ''
    }
  }

  /**
   * 写入文本文件
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    await fse.ensureDir(path.dirname(filePath))
    await fse.writeFile(filePath, content, 'utf-8')
  }

  /**
   * 检查文件是否存在
   */
  static async exists(filePath: string): Promise<boolean> {
    return await fse.pathExists(filePath)
  }

  /**
   * 扫描文件（使用 fast-glob）
   * @param patterns 匹配模式（支持数组）
   * @param options fast-glob 选项
   */
  static async scanFiles(
    patterns: string | string[],
    options?: fg.Options
  ): Promise<string[]> {
    const defaultOptions: fg.Options = {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      onlyFiles: true,
      absolute: false,
      ...options,
    }

    return await fg(patterns, defaultOptions)
  }

  /**
   * 扫描目录（返回目录路径）
   */
  static async scanDirs(
    patterns: string | string[],
    options?: fg.Options
  ): Promise<string[]> {
    const defaultOptions: fg.Options = {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      onlyDirectories: true,
      absolute: false,
      ...options,
    }

    return await fg(patterns, defaultOptions)
  }

  /**
   * 快速检查模式是否有匹配（不返回具体文件）
   */
  static async hasMatch(
    patterns: string | string[],
    options?: fg.Options
  ): Promise<boolean> {
    const files = await this.scanFiles(patterns, { ...options, deep: 1 })
    return files.length > 0
  }
}

