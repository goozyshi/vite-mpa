/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_ENV: 'development' | 'test' | 'production'
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_CDN_BASE_URL: string
  readonly VITE_CDN_URL: string
  readonly VITE_PROJECT_URL: string
  readonly VITE_WS_BASE_URL?: string // WebSocket 配置（按需使用）
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
