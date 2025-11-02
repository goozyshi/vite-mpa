import { http } from '@/services/request'
import type { RequestConfig } from '@/utils/request/types'

/**
 * 用户信息类型
 */
export interface UserInfo {
  id: number
  name: string
  avatar: string
}

/**
 * 测试响应类型
 */
export interface TestResponse {
  success: boolean
  message: string
  timestamp: number
}

/**
 * 获取用户信息
 */
export const getUserInfo = (userId: number) => {
  return http.get<UserInfo>(`/user/${userId}`)
}

/**
 * 更新用户信息
 */
export const updateUserInfo = (data: Partial<UserInfo>) => {
  return http.post<void>('/user/update', data)
}

/**
 * 测试：成功请求
 * 注意：这是示例请求，实际使用时替换为真实的 API 接口
 */
export const testSuccessRequest = () => {
  return http.get<TestResponse>('/api/test/success')
}

/**
 * 测试：失败请求（显示错误 Toast）
 */
export const testFailRequest = () => {
  return http.get<TestResponse>('/api/test/fail')
}

/**
 * 测试：静默失败（不显示错误 Toast）
 * 配置 showErrorToast: false 可以禁用错误提示
 * 适用于不需要用户感知的后台请求
 */
export const testSilentRequest = () => {
  return http.get<TestResponse>('/api/test/silent', {
    showErrorToast: false,
  } as RequestConfig)
}

/**
 * 测试：错误码白名单
 * 配置 errorCodeWhitelist 可以忽略特定错误码的 Toast
 * 适用于需要业务逻辑处理特定错误的场景
 */
export const testWhitelistRequest = () => {
  return http.post<TestResponse>('/api/test/whitelist', { test: true }, {
    errorCodeWhitelist: [404, 500],
  } as RequestConfig)
}
