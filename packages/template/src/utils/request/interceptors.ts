import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import type { ApiResponse, RequestConfig, RequestInterceptor } from './types'
import { handleBusinessError, handleNetworkError } from './errorHandler'

/**
 * 外部请求拦截器（预留给Bridge）
 */
let externalRequestInterceptor: RequestInterceptor | null = null

export const setRequestInterceptor = (interceptor: RequestInterceptor) => {
  externalRequestInterceptor = interceptor
}

/**
 * 配置请求拦截器
 */
export const setupRequestInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      config.headers = config.headers || {}

      // Web环境默认处理
      const webToken = localStorage.getItem('token')
      if (webToken) {
        config.headers.Authorization = `Bearer ${webToken}`
      }

      // 调用外部拦截器（用于Bridge增强）
      if (externalRequestInterceptor) {
        const enhancedConfig = await externalRequestInterceptor(config as RequestConfig)
        Object.assign(config, enhancedConfig)
      }

      // 自定义请求头
      const customHeaders = (config as RequestConfig).customHeaders
      if (customHeaders) {
        Object.assign(config.headers, customHeaders)
      }

      return config
    },
    (error: AxiosError) => {
      return Promise.reject(error)
    }
  )
}

/**
 * 配置响应拦截器
 */
export const setupResponseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { code, data, content } = response.data

      // 业务成功
      if (code === 200) {
        return data ?? content ?? response.data
      }

      // 业务失败
      return handleBusinessError(response, response.config as RequestConfig)
    },
    (error: AxiosError) => {
      return handleNetworkError(error, error.config as RequestConfig)
    }
  )
}
