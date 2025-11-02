/**
 * 域名配置管理（独立模块，无外部依赖）
 */

export const DOMAIN = {
  API: import.meta.env.VITE_API_BASE_URL || '',
  CDN: import.meta.env.VITE_CDN_BASE_URL || '',
  PROJECT: import.meta.env.VITE_PROJECT_URL || '',
}

// WebSocket 域名（可选扩展，需在 .env 中配置 VITE_WS_BASE_URL）
export const WS_URL = import.meta.env.VITE_WS_BASE_URL

export const getApiTimeout = () => {
  return Number(import.meta.env.VITE_API_TIMEOUT) || 30000
}
