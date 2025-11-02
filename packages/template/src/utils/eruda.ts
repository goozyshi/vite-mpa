let erudaLoaded = false
let erudaLoading = false

const ERUDA_STORAGE_KEY = 'vite_mpa_eruda_enabled'

export function isErudaEnabled(): boolean {
  return sessionStorage.getItem(ERUDA_STORAGE_KEY) === 'true'
}

export function setErudaEnabled(enabled: boolean): void {
  if (enabled) {
    sessionStorage.setItem(ERUDA_STORAGE_KEY, 'true')
  } else {
    sessionStorage.removeItem(ERUDA_STORAGE_KEY)
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
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/eruda'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Eruda加载失败'))
      document.head.appendChild(script)
    })
    ;(window as any).eruda?.init()
    erudaLoaded = true
    setErudaEnabled(true)
  } finally {
    erudaLoading = false
  }
}

export async function autoLoadEruda(): Promise<void> {
  if (isErudaEnabled() && !erudaLoaded) {
    await loadEruda()
  }
}
