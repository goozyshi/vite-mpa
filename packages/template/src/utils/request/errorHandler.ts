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
        const status = error.response.status
        if (status === 404) {
          showErrorToast('资源不存在 (404)')
        } else if (status >= 400 && status < 500) {
          showErrorToast(`请求错误 (${status})`)
        } else if (status >= 500) {
          showErrorToast(`服务器错误 (${status})`)
        } else {
          showErrorToast(`请求失败: ${status}`)
        }
      } else if (error.request) {
        showErrorToast('网络超时，请检查网络连接')
      } else {
        showErrorToast('请求错误')
      }
    }
  }

  return Promise.reject(error)
}
