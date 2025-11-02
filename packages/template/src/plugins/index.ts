import type { App } from 'vue'
import pinia from '@/stores'

export default function setupPlugins(app: App) {
  app.use(pinia)
}
