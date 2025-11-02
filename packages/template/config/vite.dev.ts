import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.base'
import pagesPlugin from '../scripts/preview/pages-plugin'

export default defineConfig(async () => {
  return mergeConfig(baseConfig, {
    plugins: [pagesPlugin()],

    server: {
      host: true,
      port: 5173,
      open: '/index.html',
      proxy: {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  })
})

