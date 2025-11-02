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
 * 测试：成功请求（实际会 404，但可以看到请求发送）
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
 */
export const testSilentRequest = () => {
  return http.get<TestResponse>('/api/test/silent', {
    showErrorToast: false,
  } as RequestConfig)
}

/**
 * 测试：错误码白名单
 */
export const testWhitelistRequest = () => {
  return http.post<TestResponse>('/api/test/whitelist', { test: true }, {
    errorCodeWhitelist: [404, 500],
  } as RequestConfig)
}
