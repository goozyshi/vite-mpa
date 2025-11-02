import { defineConfig, loadEnv } from 'vite'

export default defineConfig(async ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  const isDev = mode === 'development' || mode === 'test'

  if (isDev) {
    const config = await import('./config/vite.dev')
    return typeof config.default === 'function' ? await config.default() : config.default
  } else {
    const config = await import('./config/vite.build')
    return typeof config.default === 'function' ? await config.default() : config.default
  }
})
