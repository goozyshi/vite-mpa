import { Plugin } from 'vite'
import { scanPages } from '../utils/pages-scanner'

export default function pagesPlugin(): Plugin {
  return {
    name: 'vite-plugin-pages-inject',
    async transformIndexHtml() {
      const pages = await scanPages()
      return [
        {
          tag: 'script',
          injectTo: 'head',
          children: `window.__VITE_PAGES__ = ${JSON.stringify(pages)};`,
        },
      ]
    },
  }
}
