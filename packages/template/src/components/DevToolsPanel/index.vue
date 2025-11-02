<template>
  <Teleport to="body">
    <div v-if="isDev" class="dev-tools">
      <div v-if="!expanded" class="dev-tools__trigger" @click="expanded = true">
        <span class="dot">🛠️</span>
      </div>

      <Popup
        v-model:show="expanded"
        position="bottom"
        :style="{ padding: '16px', borderRadius: '16px 16px 0 0' }"
      >
        <div class="panel-header">
          <span class="title">开发工具</span>
          <Icon name="cross" @click="expanded = false" />
        </div>

        <div class="panel-section">
          <div class="section-label">语言切换</div>
          <RadioGroup v-model="currentLang" @change="handleLangChange">
            <Radio name="zh">中文</Radio>
            <Radio name="en">English</Radio>
            <Radio name="ar">العربية (RTL)</Radio>
          </RadioGroup>
        </div>

        <div class="panel-section">
          <Button
            type="primary"
            size="small"
            block
            :loading="erudaLoading"
            :disabled="erudaLoaded"
            @click="handleLoadEruda"
          >
            {{ erudaLoaded ? '✓ Eruda已加载' : '加载 Eruda 调试' }}
          </Button>
        </div>
      </Popup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Popup, RadioGroup, Radio, Button, Icon } from 'vant'
import { useLang } from '@/composables/useLang'
import { loadEruda, isErudaEnabled } from '@/utils/eruda'
import 'vant/lib/index.css'

const isDev = import.meta.env.DEV
const expanded = ref(false)
const erudaLoading = ref(false)
const erudaLoaded = ref(isErudaEnabled())

const { lang, setLanguage } = useLang()
const currentLang = ref(lang.value)

const handleLangChange = (value: string) => {
  setLanguage(value)
  if (import.meta.env.DEV) {
    sessionStorage.setItem('dev_lang', value)
  }
  setTimeout(() => window.location.reload(), 300)
}

const handleLoadEruda = async () => {
  erudaLoading.value = true
  try {
    await loadEruda()
    erudaLoaded.value = true
  } finally {
    erudaLoading.value = false
  }
}

onMounted(() => {
  setTimeout(() => {
    const savedLang = sessionStorage.getItem('dev_lang')
    if (savedLang && savedLang !== lang.value) {
      currentLang.value = savedLang as any
    }
  }, 1000)
})
</script>

<style lang="scss" scoped>
.dev-tools__trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9999;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:active {
    transform: scale(0.95);
  }

  .dot {
    font-size: 24px;
  }
}

[dir='rtl'] .dev-tools__trigger {
  right: auto;
  left: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .title {
    font-size: 18px;
    font-weight: 600;
  }
}

.panel-section {
  margin-bottom: 16px;

  .section-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
}
</style>
