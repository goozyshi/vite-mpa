import type { App } from 'vue'
import type { Router } from 'vue-router'
import { flushErrorBuffer } from '@/utils/error-buffer'
import { setUserContext } from './context'

/**
 * 延迟加载 Sentry（优化首屏性能）
 *
 * 特性：
 * 1. 延迟加载 Sentry SDK（减少主包 ~150KB）
 * 2. 通用错误缓冲队列（捕获加载前的所有错误，包括 Vue 内部错误）
 * 3. 支持所有环境（通过 env 配置控制）
 *
 * 注意：Vue 错误捕获已在 setupPlugins 中设置，此处无需重复设置
 */
export function initSentry(app: App, router?: Router) {
  const env = import.meta.env.VITE_APP_ENV
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN
  const sentryEnabled = import.meta.env.VITE_SENTRY_ENABLED === 'true'

  // 未配置 DSN 或未启用，跳过
  if (!sentryDsn || !sentryEnabled) {
    console.log('[Sentry] Not configured or disabled')
    return
  }

  // 延迟加载 Sentry SDK
  const loadSentry = () => {
    import('@sentry/vue')
      .then((Sentry) => {
        // 初始化 Sentry
        Sentry.init({
          app,
          dsn: sentryDsn,
          environment:
            env === 'production' ? 'Production' : env === 'test' ? 'Test' : 'Development',

          // 启用 PII（个人身份信息）发送
          sendDefaultPii: true,

          // 忽略的错误（常见的非关键错误）
          ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
            'Non-Error promise rejection captured',
          ],

          // 错误采样率（开发环境 100%，测试 50%，生产 10%）
          tracesSampleRate: env === 'development' ? 1.0 : env === 'test' ? 0.5 : 0.1,

          // 标准化深度
          normalizeDepth: 5,

          // 自定义事务名称（使用页面路径）
          beforeSend(event: any) {
            const slug = window.location.origin + window.location.pathname
            event.transaction = slug
            return event
          },

          // 集成插件
          integrations: [
            // 路由追踪（需要传入 router）
            ...(router ? [Sentry.browserTracingIntegration({ router })] : []),

            // 捕获 console.error
            Sentry.captureConsoleIntegration({
              levels: ['error'],
            }),

            // HTTP 客户端错误捕获
            Sentry.httpClientIntegration({
              failedRequestStatusCodes: [[400, 599]],
            }),
          ],
        })

        // 设置用户上下文
        setUserContext(Sentry)

        // 批量上报缓冲区中的错误
        const bufferedErrors = flushErrorBuffer()
        if (bufferedErrors.length > 0) {
          console.log(`[Sentry] 上报 ${bufferedErrors.length} 个缓冲错误`)

          bufferedErrors.forEach((buffered) => {
            if (buffered.type === 'error') {
              // 全局 JS 错误
              const error = new Error(buffered.data.message)
              if (buffered.data.error?.stack) {
                error.stack = buffered.data.error.stack
              } else {
                error.stack = `${buffered.data.filename}:${buffered.data.lineno}:${buffered.data.colno}`
              }
              Sentry.captureException(error, {
                contexts: {
                  buffered: {
                    timestamp: buffered.timestamp,
                    type: 'buffered_global_error',
                  },
                },
              })
            } else if (buffered.type === 'unhandledrejection') {
              // Promise 错误
              Sentry.captureException(buffered.data.reason, {
                contexts: {
                  buffered: {
                    timestamp: buffered.timestamp,
                    type: 'buffered_promise_rejection',
                  },
                },
              })
            } else if (buffered.type === 'vue') {
              // Vue 内部错误
              Sentry.captureException(buffered.data.error, {
                contexts: {
                  buffered: {
                    timestamp: buffered.timestamp,
                    type: 'buffered_vue_error',
                    componentName: buffered.data.componentName,
                    info: buffered.data.info,
                  },
                },
              })
            }
          })
        }

        console.log('[Sentry] Initialized successfully')
      })
      .catch((error) => {
        console.error('[Sentry] Failed to load:', error)
      })
  }

  // 使用 requestIdleCallback 延迟加载（浏览器空闲时）
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadSentry, { timeout: 2000 })
  } else {
    // 兼容不支持 requestIdleCallback 的浏览器
    setTimeout(loadSentry, 1000)
  }
}

/**
 * 手动捕获错误（需等 Sentry 加载完成）
 */
export function captureError(error: Error, context?: Record<string, any>) {
  import('@sentry/vue').then((Sentry) => {
    if (context) {
      Sentry.setContext('custom', context)
    }
    Sentry.captureException(error)
  })
}

/**
 * 手动发送消息
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  import('@sentry/vue').then((Sentry) => {
    Sentry.captureMessage(message, level)
  })
}
