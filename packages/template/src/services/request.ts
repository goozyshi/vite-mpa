import axios, { AxiosInstance } from 'axios'
import { DOMAIN, getApiTimeout } from '@/config/domain'
import { setupRequestInterceptor, setupResponseInterceptor } from '@/utils/request/interceptors'
import type { RequestConfig } from '@/utils/request/types'

/**
 * 创建Axios实例（纯Web版本，无Bridge依赖）
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: DOMAIN.API,
    timeout: getApiTimeout(),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 配置拦截器
  setupRequestInterceptor(instance)
  setupResponseInterceptor(instance)

  return instance
}

/**
 * 导出单例实例
 */
const request = createAxiosInstance()

export default request

/**
 * 便捷方法封装
 */
export const http = {
  get: <T = any>(url: string, config?: RequestConfig) => {
    return request.get<any, T>(url, config)
  },

  post: <T = any>(url: string, data?: any, config?: RequestConfig) => {
    return request.post<any, T>(url, data, config)
  },

  put: <T = any>(url: string, data?: any, config?: RequestConfig) => {
    return request.put<any, T>(url, data, config)
  },

  delete: <T = any>(url: string, config?: RequestConfig) => {
    return request.delete<any, T>(url, config)
  },
}
