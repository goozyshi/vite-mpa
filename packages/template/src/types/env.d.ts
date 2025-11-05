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
  readonly VITE_SENTRY_DSN?: string // Sentry DSN
  readonly VITE_SENTRY_ENABLED?: string // Sentry 启用开关
  readonly SENTRY_ORG?: string // Sentry 组织名
  readonly SENTRY_PROJECT?: string // Sentry 项目名
  readonly SENTRY_AUTH_TOKEN?: string // Sentry 认证令牌
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
