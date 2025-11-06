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
        <Button type="success" block>
          {{ t('chatgrow_v2300_18') }}
        </Button>
        <!-- <Button type="success" block>
          {{ t('useless') }}
        </Button> -->
        <Button type="success" block>
          {{ t('zh_去完成2') }}
        </Button>
        <Button type="success" block>
          {{ t('zh_去完成3') }}
        </Button>
      </div>

      <Divider>Axios Request Test</Divider>

      <CellGroup title="请求测试（示例接口）">
        <Cell title="基础请求" label="测试基础请求" is-link @click="handleTestSuccess" />
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
  console.log('[Test] 基础请求测试...')
  try {
    const result = await testSuccessRequest()
    console.log('[Test] 请求成功:', result)
    showToast('请求成功')
  } catch (error) {
    console.error('[Test] 请求失败:', error)
  }
}

const handleTestFail = async () => {
  console.log('[Test] 失败请求测试...')
  try {
    await testFailRequest()
  } catch (error) {
    console.error('[Test] 请求失败:', error)
  }
}

const handleTestSilent = async () => {
  console.log('[Test] 静默请求测试...')
  try {
    await testSilentRequest()
  } catch (error) {
    console.error('[Test] 静默失败:', error)
    showToast('静默失败（控制台可见）')
  }
}

const handleTestWhitelist = async () => {
  console.log('[Test] 白名单测试...')
  try {
    await testWhitelistRequest()
  } catch (error) {
    console.error('[Test] 白名单错误:', error)
    showToast('白名单错误（不显示 Toast）')
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
