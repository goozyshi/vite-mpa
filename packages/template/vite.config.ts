import { defineConfig, loadEnv } from 'vite'

export default defineConfig(async ({ mode, command }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  // preview 命令使用 dev 配置
  if (command === 'serve' || command === 'preview') {
    const config = await import('./config/vite.dev')
    return typeof config.default === 'function' ? await config.default() : config.default
  }

  // build 命令由 scripts/build.ts 处理，这里返回一个默认配置
  const baseConfig = await import('./config/vite.base')
  return baseConfig.default
})
