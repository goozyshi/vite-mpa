let erudaLoaded = false
let erudaLoading = false
const ERUDA_URL = 'https://fastly.jsdelivr.net/npm/eruda'

const ERUDA_ENABLED_KEY = 'vite_mpa_eruda_enabled' // sessionStorage: 启用状态（会话级别）
const ERUDA_CODE_KEY = 'vite_mpa_eruda_code' // localStorage: 代码缓存（持久化，避免重复下载）

export function isErudaEnabled(): boolean {
  return sessionStorage.getItem(ERUDA_ENABLED_KEY) === 'true'
}

export function setErudaEnabled(enabled: boolean): void {
  if (enabled) {
    sessionStorage.setItem(ERUDA_ENABLED_KEY, 'true')
  } else {
    sessionStorage.removeItem(ERUDA_ENABLED_KEY)
  }
}

export async function loadEruda(): Promise<void> {
  if (erudaLoaded) {
    ;(window as any).eruda?.show()
    return
  }
  if (erudaLoading) return

  erudaLoading = true
  try {
    // 检查是否有缓存的代码
    const cachedCode = localStorage.getItem(ERUDA_CODE_KEY)

    if (cachedCode) {
      // 使用缓存的代码（避免网络请求）
      try {
        // eslint-disable-next-line no-eval
        eval(cachedCode)
        ;(window as any).eruda?.init()
        erudaLoaded = true
        setErudaEnabled(true)
        return
      } catch (error) {
        console.warn('使用缓存的 Eruda 代码失败，将重新下载:', error)
        localStorage.removeItem(ERUDA_CODE_KEY)
      }
    }

    // 没有缓存或缓存失效，下载 eruda
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = ERUDA_URL
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Eruda加载失败'))
      document.head.appendChild(script)
    })
    ;(window as any).eruda?.init()
    erudaLoaded = true
    setErudaEnabled(true)

    // 下载成功后，缓存代码到 localStorage
    fetch(ERUDA_URL)
      .then((res) => res.text())
      .then((code) => {
        localStorage.setItem(ERUDA_CODE_KEY, code)
        console.log('✅ Eruda 代码已缓存到 localStorage')
      })
      .catch((err) => {
        console.warn('Eruda 代码缓存失败:', err)
      })
  } finally {
    erudaLoading = false
  }
}

export async function autoLoadEruda(): Promise<void> {
  if (isErudaEnabled() && !erudaLoaded) {
    await loadEruda()
  }
}
