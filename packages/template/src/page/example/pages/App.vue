<template>
  <div class="app">
    <DevToolsPanel />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { DevToolsPanel } from '@/components'
</script>

<style lang="scss">
@use '@/assets/css/common.scss';

.app {
  min-height: 100vh;
  background: #f7f8fa;
}
</style>

<style>
@import '@/assets/css/reset.css';
@import '@/assets/css/rem.scss';
@import '@/assets/css/rtl.css';
@import '@/assets/css/layout.css';
</style>
