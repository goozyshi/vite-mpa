import prompts from 'prompts'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import ora from 'ora'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface PageConfig {
  pageName: string
  fullPath: string
  isSubPage: boolean
  parentDir?: string
  subPageName?: string
}

async function genPage() {
  console.log(chalk.blue('🎨 Generate New Page\n'))
  console.log(chalk.gray('提示: 输入页面路径'))
  console.log(chalk.gray('  - 一级页面: activity'))
  console.log(chalk.gray('  - 二级页面: activity/2024\n'))

  const result = await prompts({
    type: 'text',
    name: 'pagePath',
    message: 'Page path:',
    initial: 'demo',
    validate: (value) => {
      if (!value) return 'Page path is required'
      // 只支持一级或二级，不支持更深层级
      const levels = value.split('/').filter((p) => p)
      if (levels.length > 2) {
        return 'Only supports 1 or 2 levels (e.g., activity or activity/2024)'
      }
      return true
    },
  })

  if (!result.pagePath) {
    console.log(chalk.red('✖ Cancelled'))
    process.exit(1)
  }

  const pathParts = result.pagePath.split('/').filter((p) => p)
  const isSubPage = pathParts.length === 2

  const config: PageConfig = {
    pageName: pathParts[pathParts.length - 1],
    fullPath: result.pagePath,
    isSubPage,
    parentDir: isSubPage ? pathParts[0] : undefined,
    subPageName: isSubPage ? pathParts[1] : undefined,
  }

  const targetDir = path.resolve(__dirname, `../src/page/${config.fullPath}`)

  if (await fse.pathExists(targetDir)) {
    console.log(chalk.red(`✖ Page ${config.fullPath} already exists`))
    process.exit(1)
  }

  const spinner = ora('Creating page structure...').start()

  try {
    await createPageStructure(targetDir, config)
    spinner.succeed(chalk.green('Page created successfully!'))
    console.log(`\nLocation: ${chalk.cyan(`src/page/${config.fullPath}`)}`)
    console.log(
      `Access: ${chalk.cyan(`http://localhost:5173/src/page/${config.fullPath}/index.html`)}\n`
    )
  } catch (error) {
    spinner.fail(chalk.red('Failed to create page'))
    throw error
  }
}

async function createPageStructure(targetDir: string, config: PageConfig) {
  await fse.ensureDir(targetDir)
  await fse.ensureDir(path.join(targetDir, 'pages'))
  await fse.ensureDir(path.join(targetDir, 'router'))
  await fse.ensureDir(path.join(targetDir, 'i18n'))

  await fse.writeFile(
    path.join(targetDir, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <link rel="icon" type="image/svg+xml" href="https://vitejs.dev/logo.svg" />
    <title>${config.pageName} - Vite MPA</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
`
  )

  await fse.writeFile(
    path.join(targetDir, 'main.ts'),
    `import { createApp } from 'vue'
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
`
  )

  await fse.writeFile(
    path.join(targetDir, 'pages/App.vue'),
    `<template>
  <div class="app">
    <DevToolsPanel />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { DevToolsPanel } from '@/components'
</script>

<style lang="scss">
@use '@/assets/css/common.scss';

.app {
  min-height: 100vh;
  background: #f7f8fa;
}
</style>

<style>
@import '@/assets/css/reset.css';
@import '@/assets/css/rem.scss';
</style>
`
  )

  await fse.writeFile(
    path.join(targetDir, 'pages/Home.vue'),
    `<template>
  <div class="home">
    <h1>{{ t('${config.pageName}.title') }}</h1>
    <p>{{ t('${config.pageName}.description') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables'

const { t } = useI18n()
</script>

<style lang="scss" scoped>
.home {
  padding: 0.32rem;
}
</style>
`
  )

  await fse.writeFile(
    path.join(targetDir, 'router/index.ts'),
    `import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue'),
  },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
`
  )

  await fse.writeFile(
    path.join(targetDir, 'i18n/index.ts'),
    `export default {
  zh: () => import('./zh.json'),
  en: () => import('./en.json'),
  ar: () => import('./ar.json'),
}
`
  )

  await fse.writeFile(
    path.join(targetDir, 'i18n/zh.json'),
    `{
  "${config.pageName}": {
    "title": "${config.pageName}页面",
    "description": "这是一个${config.pageName}描述"
  }
}
`
  )

  await fse.writeFile(
    path.join(targetDir, 'i18n/en.json'),
    `{
  "${config.pageName}": {
    "title": "${config.pageName} Page",
    "description": "This is a ${config.pageName} description"
  }
}
`
  )

  await fse.writeFile(
    path.join(targetDir, 'i18n/ar.json'),
    `{
  "${config.pageName}": {
    "title": "صفحة ${config.pageName}",
    "description": "هذا وصف ${config.pageName}"
  }
}
`
  )

  // 创建 API 目录
  await fse.ensureDir(path.join(targetDir, 'api'))

  await fse.writeFile(
    path.join(targetDir, 'api/index.ts'),
    `import { http } from '@/services/request'
import type { RequestConfig } from '@/utils/request/types'

/**
 * ${config.pageName} 页面 API
 */

// 示例 API
export const getExampleData = () => {
  return http.get<any>('/${config.pageName}/data')
}
`
  )
}

genPage().catch(console.error)
