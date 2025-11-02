import type { AxiosRequestConfig, AxiosError } from 'axios'

/**
 * 统一响应结构
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  content?: T
}

/**
 * 自定义请求配置
 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 是否显示错误Toast，默认true */
  showErrorToast?: boolean
  /** 错误码白名单 */
  errorCodeWhitelist?: number[]
  /** 自定义请求头 */
  customHeaders?: Record<string, string>
}

/**
 * 业务错误类
 */
export class BusinessError extends Error {
  code: number
  data?: any

  constructor(code: number, message: string, data?: any) {
    super(message)
    this.name = 'BusinessError'
    this.code = code
    this.data = data
  }
}

/**
 * 请求拦截钩子（用于阶段二Bridge集成）
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>

/**
 * 错误处理钩子（用于阶段二Bridge集成）
 */
export type ErrorHandler = (error: AxiosError, config?: RequestConfig) => void | Promise<void>
