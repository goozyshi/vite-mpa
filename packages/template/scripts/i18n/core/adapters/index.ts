/**
 * 格式适配器导出
 */

export { FormatAdapter, FormatType, FormatManager } from './format-adapter'
export { JSONFormatAdapter } from './json-adapter'
export { TSObjectFormatAdapter } from './ts-adapter'

/**
 * 创建默认的格式管理器（预配置）
 */
import { FormatManager, FormatType } from './format-adapter'
import { JSONFormatAdapter } from './json-adapter'
import { TSObjectFormatAdapter } from './ts-adapter'

export function createDefaultFormatManager(): FormatManager {
  const manager = new FormatManager()

  // 注册 JSON 适配器（当前使用）
  manager.register('json', new JSONFormatAdapter())

  // 注册 TS 对象适配器（预留）
  manager.register('ts-object', new TSObjectFormatAdapter())

  return manager
}
