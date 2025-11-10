import { createApp } from 'vue'
import App from './pages/App.vue'
import router from './router'
import { useLang } from '@/composables/useLang'
import setupPlugins from '@/plugins'
import i18n from './i18n'

const app = createApp(App)

setupPlugins(app)

const { setupI18n } = useLang()
await setupI18n(app, i18n)

app.use(router).mount('#app')
