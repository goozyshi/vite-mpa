import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import rtlcss from 'postcss-rtlcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        VantResolver({
          importStyle: false,
        }),
      ],
      dts: 'src/types/components.d.ts',
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
    }),
  ],

  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'vue-i18n', 'axios', 'vant'],
  },

  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@assets': resolve(__dirname, '../src/assets'),
      '@components': resolve(__dirname, '../src/components'),
      '@composables': resolve(__dirname, '../src/composables'),
      '@utils': resolve(__dirname, '../src/utils'),
    },
    extensions: ['.ts', '.tsx', '.js', '.vue', '.json', '.scss', '.css'],
  },

  css: {
    postcss: {
      plugins: [
        rtlcss({
          mode: 'combined',
          ltrPrefix: '[dir="ltr"]',
          rtlPrefix: '[dir="rtl"]',
          processKeyFrames: true,
        }) as any,
        autoprefixer(),
      ],
    },
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
})
