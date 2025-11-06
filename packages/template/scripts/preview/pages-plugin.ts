import { Plugin } from 'vite'
import { scanPages, PageEntry } from '../utils/pages-scanner'

export default function pagesPlugin(): Plugin {
  let cachedPages: PageEntry[] | null = null
  let scanPromise: Promise<PageEntry[]> | null = null

  const getScanPromise = () => {
    if (!scanPromise) {
      scanPromise = scanPages().then((pages) => {
        cachedPages = pages
        return pages
      })
    }
    return scanPromise
  }

  getScanPromise()

  return {
    name: 'vite-plugin-pages-inject',

    configureServer(server) {
      server.watcher.on('add', (file) => {
        if (file.includes('src/page') && file.endsWith('index.html')) {
          cachedPages = null
          scanPromise = null
        }
      })

      server.watcher.on('unlink', (file) => {
        if (file.includes('src/page') && file.endsWith('index.html')) {
          cachedPages = null
          scanPromise = null
        }
      })
    },

    async transformIndexHtml() {
      if (!cachedPages) {
        await getScanPromise()
      }

      return [
        {
          tag: 'script',
          injectTo: 'head',
          children: `window.__VITE_PAGES__ = ${JSON.stringify(cachedPages)};`,
        },
      ]
    },
  }
}
