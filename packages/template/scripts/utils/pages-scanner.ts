import { glob } from 'glob'
import path from 'path'

export interface PageEntry {
  name: string
  path: string
  module: string
  fullPath: string
}

export async function scanPages(): Promise<PageEntry[]> {
  // 扫描一级页面: src/page/*/index.html
  const topLevelFiles = await glob('src/page/*/index.html', {
    cwd: process.cwd(),
    absolute: false,
  })

  // 扫描二级页面: src/page/*/*/index.html
  const subLevelFiles = await glob('src/page/*/*/index.html', {
    cwd: process.cwd(),
    absolute: false,
  })

  const topLevelPages = topLevelFiles.map((file) => {
    const parts = file.split('/').slice(2)
    const pageName = parts[0]

    return {
      name: pageName,
      path: `/${file}`,
      module: pageName,
      fullPath: path.resolve(process.cwd(), file),
    }
  })

  const subLevelPages = subLevelFiles.map((file) => {
    const parts = file.split('/').slice(2)
    const module = parts[0]
    const pageName = parts[1]

    return {
      name: `${module}/${pageName}`,
      path: `/${file}`,
      module,
      fullPath: path.resolve(process.cwd(), file),
    }
  })

  return [...topLevelPages, ...subLevelPages]
}

export function groupPages(pages: PageEntry[]) {
  const grouped: Record<string, Record<string, PageEntry[]>> = {}

  pages.forEach((page) => {
    if (!grouped[page.module]) {
      grouped[page.module] = {}
    }

    const firstLetter = page.name.charAt(0).toUpperCase()
    if (!grouped[page.module][firstLetter]) {
      grouped[page.module][firstLetter] = []
    }

    grouped[page.module][firstLetter].push(page)
  })

  return grouped
}
