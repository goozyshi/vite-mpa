import { showToast } from 'vant'
import type { AxiosResponse, AxiosError } from 'axios'
import type { ApiResponse, RequestConfig, ErrorHandler } from './types'
import { BusinessError } from './types'

/**
 * 外部错误处理器（预留给Bridge）
 */
let externalErrorHandler: ErrorHandler | null = null

export const setErrorHandler = (handler: ErrorHandler) => {
  externalErrorHandler = handler
}

/**
 * 统一Toast显示（可被外部覆盖）
 */
const showErrorToast = (message: string) => {
  showToast({ message, wordBreak: 'break-word' })
}

/**
 * 处理业务错误
 */
export const handleBusinessError = (
  response: AxiosResponse<ApiResponse>,
  config?: RequestConfig
): Promise<never> => {
  const { code, message, data } = response.data
  const shouldShowToast = config?.showErrorToast !== false
  const isWhitelisted = config?.errorCodeWhitelist?.includes(code)

  // 特殊错误码示例（根据实际业务调整）
  if (code === 401) {
    console.warn('[Request] Unauthorized, token may be expired')
    // TODO: 实现token刷新或跳转登录
  }

  // 显示错误提示
  if (shouldShowToast && !isWhitelisted) {
    showErrorToast(message || 'Request failed')
  }

  return Promise.reject(new BusinessError(code, message, data))
}

/**
 * 处理网络错误
 */
export const handleNetworkError = async (
  error: AxiosError,
  config?: RequestConfig
): Promise<never> => {
  // 调用外部错误处理器（如Bridge Toast）
  if (externalErrorHandler) {
    await externalErrorHandler(error, config)
  } else {
    // 默认Web错误处理
    const shouldShowToast = config?.showErrorToast !== false

    if (shouldShowToast) {
      if (error.response) {
        showErrorToast(`Request failed: ${error.response.status}`)
      } else if (error.request) {
        showErrorToast('Network timeout, please try again')
      } else {
        showErrorToast('Request error')
      }
    }
  }

  return Promise.reject(error)
}
