<template>
  <div class="home">
    <div class="hero">
      <img src="https://vitejs.dev/logo.svg" alt="Vite" class="logo" />
      <h1>{{ t('example.title') }}</h1>
      <p>{{ t('example.description') }}</p>
    </div>

    <div class="content">
      <CellGroup>
        <Cell :title="t('common.confirm')" is-link />
        <Cell :title="t('common.cancel')" is-link />
        <Cell :title="t('common.save')" is-link />
      </CellGroup>

      <div class="button-group">
        <Button type="primary" block>
          {{ t('example.button1') }}
        </Button>
        <Button type="success" block>
          {{ t('common.submit') }}
        </Button>
      </div>

      <Divider>Axios Request Test</Divider>

      <CellGroup title="请求测试">
        <Cell
          title="成功请求"
          label="测试基础请求（会 404，查看 Network）"
          is-link
          @click="handleTestSuccess"
        />
        <Cell title="失败请求" label="测试错误处理（显示 Toast）" is-link @click="handleTestFail" />
        <Cell
          title="静默失败"
          label="测试静默请求（不显示 Toast）"
          is-link
          @click="handleTestSilent"
        />
        <Cell
          title="白名单测试"
          label="测试错误码白名单（不显示 Toast）"
          is-link
          @click="handleTestWhitelist"
        />
      </CellGroup>

      <Divider>System Info</Divider>

      <div class="info">
        <p>Environment: {{ env }}</p>
        <p>API Base: {{ apiBase }}</p>
        <p>Language: {{ lang }}</p>
        <p>Direction: {{ dir }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n, useLang } from '@/composables'
import { Button, CellGroup, Cell, Divider, showToast } from 'vant'
import 'vant/lib/index.css'
import {
  testSuccessRequest,
  testFailRequest,
  testSilentRequest,
  testWhitelistRequest,
} from '../api'

const { t } = useI18n()
const { lang, isRTL } = useLang()

const env = computed(() => import.meta.env.VITE_APP_ENV)
const apiBase = computed(() => import.meta.env.VITE_API_BASE_URL)
const dir = computed(() => (isRTL.value ? 'RTL' : 'LTR'))

const handleTestSuccess = async () => {
  console.log('[Test] Success request...')
  try {
    const result = await testSuccessRequest()
    console.log('[Test] Success result:', result)
    showToast('请求成功（实际会 404）')
  } catch (error) {
    console.error('[Test] Success error:', error)
  }
}

const handleTestFail = async () => {
  console.log('[Test] Fail request...')
  try {
    await testFailRequest()
  } catch (error) {
    console.error('[Test] Fail error:', error)
  }
}

const handleTestSilent = async () => {
  console.log('[Test] Silent request...')
  try {
    await testSilentRequest()
  } catch (error) {
    console.error('[Test] Silent error (no toast):', error)
    showToast('静默失败（控制台可见）')
  }
}

const handleTestWhitelist = async () => {
  console.log('[Test] Whitelist request...')
  try {
    await testWhitelistRequest()
  } catch (error) {
    console.error('[Test] Whitelist error (no toast):', error)
    showToast('白名单错误（不显示错误 Toast）')
  }
}
</script>

<style lang="scss" scoped>
.home {
  padding: 0.32rem;
}

.hero {
  text-align: center;
  padding: 0.64rem 0;

  .logo {
    width: 1.28rem;
    height: 1.28rem;
    margin: 0 auto 0.32rem;
  }

  h1 {
    font-size: 0.48rem;
    margin-bottom: 0.16rem;
  }

  p {
    font-size: 0.28rem;
    color: #666;
  }
}

.content {
  margin-top: 0.32rem;
}

.button-group {
  margin-top: 0.32rem;
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
}

.info {
  margin-top: 0.32rem;
  padding: 0.24rem;
  background: #fff;
  border-radius: 0.16rem;

  p {
    font-size: 0.24rem;
    line-height: 1.8;
    color: #666;
  }
}
</style>
