import { mergeConfig, type UserConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import baseConfig from './vite.base'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 为单个页面生成独立的构建配置
 *
 * @param pageName 页面名称（例如: example）
 * @param pageDir 页面目录绝对路径（例如: /path/to/src/page/example）
 * @returns 独立的 Vite 配置对象
 */
export function createBuildConfig(pageName: string, pageDir: string): UserConfig {
  // mergeConfig 会创建新的配置对象，确保每个构建实例独立
  return mergeConfig(baseConfig, {
    base: process.env.VITE_CDN_URL || '/',

    // 设置页面根目录（独立）
    root: pageDir,

    build: {
      target: 'esnext',
      // 输出到独立目录 dist/{pageName}/
      outDir: resolve(__dirname, `../dist/${pageName}`),
      emptyOutDir: true,
      rollupOptions: {
        // 单页面构建，input 自动使用 root 下的 index.html
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
          manualChunks: (id) => {
            // 合并所有 i18n 语言文件到一个 chunk
            if (
              id.includes('/i18n/common/') ||
              id.includes('/i18n/zh.json') ||
              id.includes('/i18n/en.json') ||
              id.includes('/i18n/ar.json')
            ) {
              return 'i18n-common'
            }
            // 合并 Vant 组件
            if (id.includes('node_modules/vant')) {
              return 'vant'
            }
            // 合并 Vue 生态（包含 vue-i18n，确保依赖顺序正确）
            if (
              id.includes('node_modules/vue') ||
              id.includes('node_modules/pinia') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/vue-i18n') ||
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/@intlify/')
            ) {
              return 'vue-vendor'
            }
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
}
