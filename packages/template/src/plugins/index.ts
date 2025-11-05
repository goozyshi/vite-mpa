import type { App } from 'vue'
import type { Router } from 'vue-router'
import pinia from '@/stores'
import { setupVueErrorCapture } from '@/utils/error-buffer'
import { initSentry } from './sentry/index'

/**
 * 统一插件初始化入口（企业级实践）
 */
export default function setupPlugins(app: App, router?: Router) {
  // 1️⃣ 设置 Vue 错误捕获（全局错误已在模块加载时自动监听）
  setupVueErrorCapture(app)

  // 2️⃣ Sentry 初始化（会消费错误缓冲）
  initSentry(app, router)

  // 3️⃣ 其他插件
  app.use(pinia)
}
