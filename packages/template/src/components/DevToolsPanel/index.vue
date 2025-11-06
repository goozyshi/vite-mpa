<template>
  <Teleport to="body">
    <div v-if="isDevOrTest" class="dev-tools">
      <!-- 悬浮按钮：小圆点，扩大触摸区域 -->
      <div v-if="!expanded" class="trigger" @click="expanded = true"></div>

      <!-- 面板 -->
      <div v-if="expanded" class="panel" @click.self="expanded = false">
        <div class="panel-content">
          <!-- 标题栏 -->
          <div class="header">
            <span>开发工具</span>
            <span class="close" @click="expanded = false">×</span>
          </div>

          <!-- 语言选择 -->
          <div class="row">
            <span>🌐</span>
            <select v-model="currentLang" @change="handleLangChange">
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <!-- 快捷操作 -->
          <div class="actions">
            <button @click="handleRefresh">🔄<br />刷新</button>
            <button :disabled="erudaLoaded" @click="handleLoadEruda">
              {{ erudaLoaded ? '✓' : '🐛' }}<br />Eruda
            </button>
            <button @click="handleCopyToken">🔑<br />Token</button>
            <button @click="handleClearCache">🗑️<br />清缓存</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLang } from '@/composables/useLang'
import { loadEruda, isErudaEnabled } from '@/utils/eruda'

const isDevOrTest = import.meta.env.DEV || import.meta.env.MODE === 'test'
const expanded = ref(false)
const erudaLoaded = ref(isErudaEnabled())

const { lang, setLanguage } = useLang()
const currentLang = ref(lang.value)

// 简单的 toast 实现
const showToast = (msg: string) => {
  const toast = document.createElement('div')
  toast.textContent = msg
  toast.style.cssText =
    'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.8);color:#fff;padding:12px 20px;border-radius:4px;font-size:14px;z-index:99999;'
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2000)
}

const handleLangChange = (e: Event) => {
  const value = (e.target as HTMLSelectElement).value
  setLanguage(value)
  if (import.meta.env.DEV) sessionStorage.setItem('dev_lang', value)
  setTimeout(() => location.reload(), 300)
}

const handleRefresh = () => location.reload()

const handleLoadEruda = async () => {
  try {
    await loadEruda()
    erudaLoaded.value = true
  } catch {
    showToast('加载失败')
  }
}

const handleCopyToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) return showToast('未找到 Token')
  navigator.clipboard.writeText(token).then(
    () => showToast('✓ Token 已复制'),
    () => showToast('复制失败')
  )
}

const handleClearCache = () => {
  ;['vite_mpa_eruda_code', 'dev_lang'].forEach((k) => localStorage.removeItem(k))
  sessionStorage.clear()
  showToast('✓ 缓存已清除')
}

onMounted(() => {
  setTimeout(() => {
    const saved = sessionStorage.getItem('dev_lang')
    if (saved && saved !== lang.value) currentLang.value = saved as any
  }, 1000)
})
</script>

<style scoped>
.trigger {
  position: fixed;
  bottom: 12px;
  right: 12px;
  width: 12px;
  height: 12px;
  padding: 16px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.2) 30%,
    transparent 30%
  );
  cursor: pointer;
  z-index: 9999;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.trigger:active {
  background: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.35) 30%,
    rgba(0, 0, 0, 0.05) 30%
  );
}

.panel {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}
.panel-content {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 12px 16px 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}
.close {
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 12px;
}
.row select {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
}

.actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.actions button {
  padding: 10px 4px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.4;
  cursor: pointer;
  min-height: 52px;
}
.actions button:active {
  background: #e5e5e5;
}
.actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
