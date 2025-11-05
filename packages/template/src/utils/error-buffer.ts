/**
 * 通用错误缓冲队列
 *
 * 职责：
 * 1. 捕获三类错误：全局 JS 错误、Promise 错误、Vue 内部错误
 * 2. 在监控工具加载前缓冲错误，避免错误丢失
 * 3. 与具体监控工具（Sentry、Bugsnag 等）解耦
 *
 * 设计思想：
 * - 全局错误监听在模块加载时自动设置（无需手动调用）
 * - Vue 错误处理需要 app 实例，通过 setupVueErrorCapture() 显式设置
 * - 监控工具通过 flushErrorBuffer() 获取并清空缓冲
 */

export interface BufferedError {
  type: 'error' | 'unhandledrejection' | 'vue'
  timestamp: number
  data: any
}

class ErrorBuffer {
  private buffer: BufferedError[] = []
  private maxBufferSize = 50
  private isReady = false

  constructor() {
    this.setupGlobalListeners()
  }

  /**
   * 设置全局错误监听（立即执行，无需 Vue app）
   */
  private setupGlobalListeners() {
    // 捕获全局 JS 错误
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'error',
        timestamp: Date.now(),
        data: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        },
      })
    })

    // 捕获 Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'unhandledrejection',
        timestamp: Date.now(),
        data: {
          reason: event.reason,
        },
      })
    })
  }

  /**
   * 设置 Vue 错误监听（需要 app 实例）
   */
  setupVueErrorHandler(app: any) {
    const originalErrorHandler = app.config.errorHandler

    app.config.errorHandler = (err: any, instance: any, info: string) => {
      // 缓冲 Vue 错误
      this.captureError({
        type: 'vue',
        timestamp: Date.now(),
        data: {
          error: err,
          componentName: instance?.$options?.name || instance?.__name || 'Anonymous',
          info,
          stack: err?.stack,
        },
      })

      // 调用原有的 errorHandler（如果存在）
      if (originalErrorHandler) {
        originalErrorHandler(err, instance, info)
      }

      // 开发环境打印错误
      if (import.meta.env.DEV) {
        console.error('[Vue Error]', err)
      }
    }
  }

  private captureError(error: BufferedError) {
    // 监控工具已加载，跳过缓冲（由监控工具直接处理）
    if (this.isReady) {
      return
    }

    // 限制缓冲区大小
    if (this.buffer.length >= this.maxBufferSize) {
      this.buffer.shift()
    }

    this.buffer.push(error)

    if (import.meta.env.DEV) {
      console.warn('[ErrorBuffer] 缓冲错误:', error)
    }
  }

  /**
   * 获取并清空缓冲区
   */
  flush(): BufferedError[] {
    const errors = [...this.buffer]
    this.buffer = []
    this.isReady = true
    return errors
  }

  /**
   * 获取缓冲区大小
   */
  size(): number {
    return this.buffer.length
  }
}

// 立即创建单例并开始监听全局错误
const errorBuffer = new ErrorBuffer()

/**
 * 设置 Vue 错误捕获
 * @param app Vue app 实例
 */
export function setupVueErrorCapture(app: any) {
  errorBuffer.setupVueErrorHandler(app)

  if (import.meta.env.DEV) {
    console.log('[ErrorBuffer] Vue 错误捕获已设置')
  }
}

/**
 * 获取并清空错误缓冲区（供监控工具使用）
 * @returns 缓冲的错误列表
 */
export function flushErrorBuffer(): BufferedError[] {
  return errorBuffer.flush()
}

/**
 * 获取错误缓冲区统计信息（仅用于调试）
 */
export function getErrorBufferStats() {
  return {
    size: errorBuffer.size(),
  }
}
