/**
 * 翻译文件格式适配器接口
 * 用于支持不同格式的翻译文件（JSON、TS 对象等）
 */

/**
 * 格式适配器接口
 */
export interface FormatAdapter {
  /**
   * 读取翻译文件
   * @param filePath 文件路径
   * @returns key-value 对象
   */
  read(filePath: string): Promise<Record<string, any>>

  /**
   * 写入翻译文件
   * @param filePath 文件路径
   * @param data key-value 对象
   */
  write(filePath: string, data: Record<string, any>): Promise<void>

  /**
   * 获取文件扩展名
   */
  getFileExtension(): string

  /**
   * 格式化输出（可选，用于代码生成）
   */
  format?(data: Record<string, any>): string
}

/**
 * 格式类型
 */
export type FormatType = 'json' | 'ts-object'

/**
 * 格式管理器
 * 根据配置选择合适的适配器
 */
export class FormatManager {
  private adapters: Map<FormatType, FormatAdapter> = new Map()

  /**
   * 注册适配器
   */
  register(type: FormatType, adapter: FormatAdapter): void {
    this.adapters.set(type, adapter)
  }

  /**
   * 获取适配器
   */
  getAdapter(type: FormatType): FormatAdapter {
    const adapter = this.adapters.get(type)
    if (!adapter) {
      throw new Error(`No adapter registered for format: ${type}`)
    }
    return adapter
  }

  /**
   * 检查是否支持某种格式
   */
  supports(type: FormatType): boolean {
    return this.adapters.has(type)
  }
}
