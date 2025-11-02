import { glob } from 'glob'
import path from 'path'

export interface PageEntry {
  name: string
  path: string
  module: string
  fullPath: string
}

export async function scanPages(): Promise<PageEntry[]> {
  const htmlFiles = await glob('src/page/**/index.html', {
    cwd: process.cwd(),
    absolute: false,
  })

  return htmlFiles.map((file) => {
    const parts = file.split('/').slice(2)
    const moduleName = parts[0]
    const pageName = parts.slice(0, -1).join('/')

    return {
      name: pageName,
      path: `/${file}`,
      module: moduleName,
      fullPath: path.resolve(process.cwd(), file),
    }
  })
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

