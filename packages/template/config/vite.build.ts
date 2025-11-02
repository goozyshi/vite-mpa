import { defineConfig, mergeConfig } from 'vite'
import { resolve } from 'path'
import baseConfig from './vite.base'
import { scanPages } from '../scripts/utils/pages-scanner'

export default defineConfig(async () => {
  const pages = await scanPages()

  const input: Record<string, string> = {}
  pages.forEach((page) => {
    input[page.name] = page.fullPath
  })

  return mergeConfig(baseConfig, {
    base: process.env.VITE_CDN_URL || '/',

    build: {
      target: 'esnext',
      outDir: resolve(__dirname, '../dist'),
      emptyOutDir: true,
      rollupOptions: {
        input,
        output: {
          format: 'es',
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name?.split('.').pop()
            if (/png|jpe?g|svg|gif|webp|ico/i.test(ext!)) {
              return 'images/[name]-[hash][extname]'
            }
            if (/css/i.test(ext!)) {
              return 'css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.VITE_APP_ENV === 'production',
        },
      },
    },
  })
})

