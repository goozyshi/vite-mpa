/**
 * 页面过滤器
 *
 * 根据 config/pages.ts 的配置来过滤要扫描的页面
 * 只处理 buildPages 中配置的页面，避免不必要的扫描
 */

import path from 'path'
import { FileUtils } from './file-utils'

export interface PageFilterConfig {
  buildPages: RegExp[]
  shouldBuildPage: (pageName: string) => boolean
}

/**
 * 加载页面过滤配置
 */
export async function loadPageFilter(
  configPath: string = path.resolve(process.cwd(), 'config/pages.ts')
): Promise<PageFilterConfig> {
  try {
    // 动态导入配置文件
    const config = await import(configPath)
    return {
      buildPages: config.buildPages || [],
      shouldBuildPage: config.shouldBuildPage || (() => true),
    }
  } catch (error) {
    console.warn('⚠️  无法加载页面过滤配置，将扫描所有页面')
    // 默认配置：扫描所有页面
    return {
      buildPages: [/^.*$/],
      shouldBuildPage: () => true,
    }
  }
}

/**
 * 过滤页面列表
 */
export async function filterPages(
  pages: string[],
  config?: PageFilterConfig
): Promise<{ filtered: string[]; skipped: string[] }> {
  // 如果没有提供配置，尝试加载
  const pageFilter = config || (await loadPageFilter())

  // 空配置表示不构建任何页面
  if (pageFilter.buildPages.length === 0) {
    return {
      filtered: [],
      skipped: pages,
    }
  }

  const filtered: string[] = []
  const skipped: string[] = []

  for (const page of pages) {
    if (pageFilter.shouldBuildPage(page)) {
      filtered.push(page)
    } else {
      skipped.push(page)
    }
  }

  return { filtered, skipped }
}

/**
 * 扫描并过滤页面目录
 */
export async function scanAndFilterPages(
  srcPath: string,
  config?: PageFilterConfig
): Promise<{ filtered: string[]; skipped: string[]; total: number }> {
  // 扫描所有页面
  const allPages = await FileUtils.scanDirs(['*'], {
    cwd: srcPath,
    absolute: false,
    onlyDirectories: true,
  })

  // 过滤页面
  const { filtered, skipped } = await filterPages(allPages, config)

  return {
    filtered,
    skipped,
    total: allPages.length,
  }
}

/**
 * 检查单个页面是否应该被扫描
 */
export async function shouldScanPage(
  pageName: string,
  config?: PageFilterConfig
): Promise<boolean> {
  const pageFilter = config || (await loadPageFilter())

  // 空配置表示不扫描任何页面
  if (pageFilter.buildPages.length === 0) {
    return false
  }

  return pageFilter.shouldBuildPage(pageName)
}
