import { createApp } from 'vue'
import App from './pages/App.vue'
import router from './router'
import { useLang } from '@/composables/useLang'
import setupPlugins from '@/plugins'
import { autoLoadEruda } from '@/utils'
import i18n from './i18n'

// 在开发环境下自动加载 Eruda（如果之前启用过）
if (import.meta.env.DEV) {
  autoLoadEruda()
}

const app = createApp(App)

// 统一插件初始化（包含错误捕获、Sentry 等）
setupPlugins(app, router)

const { setupI18n } = useLang()
await setupI18n(app, i18n)

app.use(router).mount('#app')
