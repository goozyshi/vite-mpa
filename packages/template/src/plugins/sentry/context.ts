/**
 * Sentry 用户上下文设置
 */

/**
 * 设置用户上下文
 */
export function setUserContext(Sentry: any) {
  try {
    // 从 localStorage 获取用户信息（根据实际业务调整）
    const userId = localStorage.getItem('userId')
    if (userId) {
      Sentry.setUser({
        id: userId,
        ip_address: '{{auto}}', // 自动获取 IP
      })
    }

    // 设置网络上下文
    const connection = (navigator as any).connection
    Sentry.setContext('network', {
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      online: navigator.onLine,
    })

    // 设置设备上下文
    Sentry.setContext('device', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
    })

    // 监听网络状态变化
    window.addEventListener('online', () => {
      Sentry.setContext('network', {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        online: true,
      })
    })

    window.addEventListener('offline', () => {
      Sentry.setContext('network', {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        online: false,
      })
    })
  } catch (error) {
    console.error('[Sentry] Failed to set context:', error)
  }
}
