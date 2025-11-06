import fg from 'fast-glob'
import path from 'path'

export interface PageEntry {
  name: string
  path: string
  module: string
  fullPath: string
}

export async function scanPages(): Promise<PageEntry[]> {
  const files = await fg('src/page/**/index.html', {
    cwd: process.cwd(),
    absolute: false,
    deep: 2,
    onlyFiles: true,
  })

  const pages: PageEntry[] = []

  for (const file of files) {
    const parts = file.split('/').slice(2)

    if (parts.length === 2) {
      const pageName = parts[0]
      pages.push({
        name: pageName,
        path: `/${file}`,
        module: pageName,
        fullPath: path.resolve(process.cwd(), file),
      })
    } else if (parts.length === 3) {
      const module = parts[0]
      const pageName = parts[1]
      pages.push({
        name: `${module}/${pageName}`,
        path: `/${file}`,
        module,
        fullPath: path.resolve(process.cwd(), file),
      })
    }
  }

  return pages
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
