/**
 * 构建页面过滤配置
 *
 * 配置说明：
 * - 空数组：不构建任何页面（默认，避免误操作）
 * - 通配符正则：构建所有页面
 * - 特定正则：只构建匹配的页面
 * - 前缀匹配：构建所有特定前缀开头的页面
 *
 * 示例：
 * // 构建所有页面
 * export const buildPages = [/^.*$/]
 *
 * // 只构建 example
 * export const buildPages = [/^example$/]
 *
 * // 构建多个指定页面
 * export const buildPages = [/^example$/, /^test-page$/]
 */
export const buildPages: RegExp[] = [
  // 默认：不构建任何页面
  // 使用时请取消注释以下某一行：
  // 构建所有页面
  /^.*$/,
  // 只构建 example 页面
  // /^example$/,
  // 构建多个指定页面
  // /^example$/,
  // /^test-page$/,
]

/**
 * 检查页面是否应该被构建
 */
export function shouldBuildPage(pageName: string): boolean {
  // 空数组：不构建任何页面
  if (buildPages.length === 0) {
    return false
  }

  // 匹配任一正则即构建
  return buildPages.some((regex) => regex.test(pageName))
}
