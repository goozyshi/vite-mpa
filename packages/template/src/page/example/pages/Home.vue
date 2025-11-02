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
          {{ t('example.button') }}
        </Button>
        <Button type="success" block>
          {{ t('common.submit') }}
        </Button>
      </div>

      <Divider>Vite MPA Template</Divider>

      <div class="info">
        <p>Environment: {{ env }}</p>
        <p>Language: {{ lang }}</p>
        <p>Direction: {{ dir }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n, useLang } from '@/composables'
import { Button, CellGroup, Cell, Divider } from 'vant'
import 'vant/lib/index.css'

const { t } = useI18n()
const { lang, isRTL } = useLang()

const env = computed(() => import.meta.env.VITE_APP_ENV)
const dir = computed(() => (isRTL.value ? 'RTL' : 'LTR'))
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
