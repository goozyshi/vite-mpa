/**
 * 构建页面过滤配置
 *
 * 配置说明：
 * - 空数组：不构建任何页面（默认，避免误操作）
 * - 通配符正则：构建所有页面
 * - 特定正则：只构建匹配的页面
 * 示例：
 *  构建所有页面
 * export const buildPages = [/^.*$/]
 *
 * 构建多个指定页面
 * export const buildPages = [/^example$/, /^activity\/2024$/, /^user\/profile$/]
 */
export const buildPages: RegExp[] = [/example/]

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
