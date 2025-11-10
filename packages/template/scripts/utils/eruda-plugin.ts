import { Plugin } from 'vite'

/**
 * Eruda 调试工具自动注入插件
 * 在开发和测试环境自动注入 Eruda 早期加载脚本
 */
export function erudaPlugin(): Plugin {
  return {
    name: 'vite-plugin-eruda-inject',

    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // 仅在开发环境或测试环境注入
        const env = process.env.VITE_APP_ENV || 'development'
        const isDev = ctx.server !== undefined // 开发服务器运行中
        const isTest = env === 'test'

        if (!isDev && !isTest) {
          return html
        }

        // Eruda 早期加载脚本（支持缓存优化）
        const erudaScript = `
      ;(function () {
        // 检查是否启用了 eruda（会话级别）
        if (sessionStorage.getItem('vite_mpa_eruda_enabled') !== 'true') {
          return
        }

        // 尝试从 localStorage 读取缓存的 eruda 代码
        var cachedCode = localStorage.getItem('vite_mpa_eruda_code')

        if (cachedCode) {
          // ✅ 使用缓存的代码，直接执行（避免网络请求）
          try {
            eval(cachedCode)
            window.eruda && window.eruda.init()
          } catch (e) {
            console.error('Eruda 缓存代码执行失败:', e)
            // 清除失效的缓存，下次重新下载
            localStorage.removeItem('vite_mpa_eruda_code')
          }
        } else {
          // ❌ 没有缓存，需要下载（仅首次或缓存失效时）
          var script = document.createElement('script')
          script.src = 'https://fastly.jsdelivr.net/npm/eruda'
          script.onload = function () {
            window.eruda && window.eruda.init()

            // 下载成功后，缓存代码到 localStorage
            fetch('https://fastly.jsdelivr.net/npm/eruda')
              .then(function (res) {
                return res.text()
              })
              .then(function (code) {
                localStorage.setItem('vite_mpa_eruda_code', code)
              })
              .catch(function (err) {
                console.warn('Eruda 代码缓存失败:', err)
              })
          }
          document.head.appendChild(script)
        }
      })()
        `.trim()

        return [
          {
            tag: 'script',
            injectTo: 'head',
            children: erudaScript,
          },
        ]
      },
    },
  }
}

