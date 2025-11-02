# vite-mpa

> 基于 Vite5 + Vue3 + TypeScript 的现代化 MPA（多页面应用）模板项目

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange)](https://pnpm.io/)

## ✨ 特性

- ⚡️ **Vite 5** - 极速的开发体验与 HMR
- 🖖 **Vue 3** - 组合式 API，<script setup>
- 🔥 **TypeScript 5** - 类型安全，智能提示
- 🌍 **多语言支持** - zh/en/ar，按需加载，自动合并公共翻译
- 📱 **rem 适配** - 基于 750px 设计稿（13.3333vw）
- 🎨 **Vant 4** - 轻量级移动端 Vue 组件库
- 🔄 **RTL 自动适配** - postcss-rtlcss 自动处理阿拉伯语等
- 🗂️ **Pinia** - Vue 3 官方状态管理
- 🛣️ **Vue Router 4** - 单页路由管理
- 🛠️ **开发工具面板** - 内置语言切换、Eruda 调试工具
- 📦 **pnpm Workspace** - Monorepo 架构
- 🎯 **按需构建** - 支持指定页面构建
- 🚀 **一键创建** - CLI 脚手架工具

## 🚀 快速开始

### 创建新项目

```bash
# 使用 pnpm（推荐）
pnpm create vite-mpa my-app

# 使用 npm
npm create vite-mpa@latest my-app

# 使用 yarn
yarn create vite-mpa my-app
```

### 开发

```bash
cd my-app
pnpm install
pnpm dev
```

访问 http://localhost:5173 查看页面预览列表

### 创建新页面

```bash
pnpm gen:page
```

按照提示输入模块名和页面名，自动生成完整的页面结构（包含 i18n、router、pages 等）

### 构建

```bash
# 构建生产环境
pnpm build

# 构建测试环境
pnpm build:test
```

## 📦 项目结构

```
vite-mpa/
├── packages/
│   ├── cli/                    # CLI 脚手架工具
│   │   ├── src/
│   │   │   ├── index.ts        # CLI 入口
│   │   │   ├── create-project.ts
│   │   │   └── utils/
│   │   └── package.json
│   └── template/               # 模板项目
│       ├── config/             # Vite 配置
│       ├── scripts/            # 脚本工具
│       │   ├── gen-page.ts     # 页面生成器
│       │   ├── preview/        # 开发预览
│       │   └── utils/
│       ├── src/
│       │   ├── assets/         # 静态资源
│       │   ├── components/     # 公共组件
│       │   ├── composables/    # 组合式函数
│       │   ├── i18n/           # 国际化配置
│       │   ├── page/           # 页面（MPA 入口）
│       │   │   └── example/
│       │   │       ├── i18n/   # 页面级翻译
│       │   │       ├── pages/  # 页面组件
│       │   │       ├── router/ # 路由配置
│       │   │       ├── index.html
│       │   │       └── main.ts
│       │   ├── stores/         # Pinia stores
│       │   ├── types/          # TS 类型定义
│       │   └── utils/          # 工具函数
│       └── package.json
├── pnpm-workspace.yaml
└── package.json
```

## 🌍 多语言使用

### 配置语言

在 `src/i18n/config.ts` 中统一管理：

```typescript
export const SUPPORTED_LOCALES = ["en", "zh", "ar"] as const;
export const DEFAULT_LOCALE: LangType = "en";
export const FALLBACK_LOCALE: LangType = "en";
```

### 页面级翻译

每个页面的 `i18n/index.ts`：

```typescript
export default {
  zh: () => import("./zh.json"),
  en: () => import("./en.json"),
  ar: () => import("./ar.json"),
};
```

### 使用翻译

```vue
<script setup lang="ts">
import { useI18n } from "@/composables";
const { t } = useI18n();
</script>

<template>
  <div>{{ t("common.confirm") }}</div>
  <div>{{ t("example.title") }}</div>
</template>
```

## 🛠️ 开发工具

### 开发工具面板

开发模式下，页面右下角（RTL 为左下角）显示工具按钮：

- **语言切换** - 实时切换应用语言
- **Eruda 调试** - 移动端调试工具，按需加载

### 页面预览

访问 http://localhost:5173 可以查看所有页面列表：

- 按模块分组
- 支持搜索
- 点击直接访问

## 📱 rem 适配

基于 750px 设计稿，使用 `13.3333vw` 根字体大小：

```
设计稿尺寸 / 100 = rem 值

750px = 7.5rem
100px = 1rem
28px = 0.28rem
```

## 🔄 RTL 支持

集成 `postcss-rtlcss`，自动处理 RTL 布局：

- 阿拉伯语自动应用 RTL
- CSS 属性自动镜像（left/right、margin、padding 等）
- 无需手动编写 RTL 样式

## 🎯 环境配置

使用 Vite 原生 `.env` 文件：

- `.env` - 所有环境共享
- `.env.development` - 开发环境
- `.env.test` - 测试环境
- `.env.production` - 生产环境

## 📝 代码规范

项目使用 ESLint + Prettier：

- 无分号
- 单引号
- 2 空格缩进

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化
pnpm format
```

## 🤝 贡献

查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何参与贡献

## 📄 License

[MIT](./LICENSE) © 2025

## 🔗 相关链接

- [Vite](https://vitejs.dev/)
- [Vue 3](https://vuejs.org/)
- [Vant](https://vant-ui.github.io/)
- [vue-i18n](https://vue-i18n.intlify.dev/)
- [postcss-rtlcss](https://github.com/elchininet/postcss-rtlcss)
