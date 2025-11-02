# Vite MPA Template

基于 Vite5 + Vue3 + TypeScript 的多页面应用(MPA)模板项目

## 技术栈

- ⚡️ **Vite 5** - 极速的开发体验
- 🖖 **Vue 3** - 渐进式 JavaScript 框架
- 🔥 **TypeScript 5** - 类型安全
- 🌍 **vue-i18n 11** - 多语言支持（zh/en/ar），按需加载
- 📱 **rem 适配** - 基于 750px 设计稿（13.3333vw）
- 🎨 **Vant 4** - 轻量级移动端 Vue 组件库
- 🔄 **postcss-rtlcss** - RTL 自动适配
- 🗂️ **Pinia** - Vue 3 状态管理
- 🛣️ **Vue Router 4** - 路由管理
- 📦 **pnpm** - 快速、节省磁盘空间的包管理器

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发环境

```bash
# 启动开发服务器（development）
pnpm dev

# 启动开发服务器（test环境）
pnpm dev:test
```

访问 http://localhost:5173 查看页面预览列表

### 构建

```bash
# 构建生产环境
pnpm build

# 构建测试环境
pnpm build:test
```

### 创建新页面

```bash
pnpm gen:page
```

按照提示输入页面路径，自动生成页面结构

**支持两种结构**：

1. **一级页面**（独立页面）
   - 输入：`activity`
   - 创建：`src/page/activity/index.html`
   - 访问：`/src/page/activity/index.html`

2. **二级页面**（归档在一级目录下）
   - 输入：`activity/2024`
   - 创建：`src/page/activity/2024/index.html`
   - 访问：`/src/page/activity/2024/index.html`
   - 注意：一级目录 `activity/` 仅作为归档文件夹，不包含 index.html

**示例**：

```bash
pnpm gen:page
✔ Page path: activity        # 创建一级页面
✔ Page path: activity/2024   # 创建二级页面
✔ Page path: 2023            # 创建一级页面
```

## 项目结构

```
packages/template/
├── config/                  # Vite配置
│   ├── vite.base.ts        # 基础配置
│   ├── vite.dev.ts         # 开发环境配置
│   ├── vite.build.ts       # 构建配置
│   └── pages.ts            # 页面过滤配置
├── scripts/                # 脚本
│   ├── gen-page.ts         # 生成页面脚本
│   ├── preview/            # 开发预览页
│   └── utils/              # 工具函数
├── src/
│   ├── assets/             # 静态资源
│   │   └── css/
│   │       ├── reset.css   # CSS重置
│   │       ├── rem.scss    # rem适配
│   │       └── common.scss # 公共样式
│   ├── components/         # 公共组件
│   │   └── DevToolsPanel/  # 开发工具面板
│   ├── composables/        # 组合式函数
│   │   └── useLang.ts      # 多语言hook
│   ├── i18n/               # 国际化
│   │   ├── config.ts       # 语言配置
│   │   ├── index.ts        # i18n入口
│   │   └── common/         # 公共翻译
│   │       ├── zh.json
│   │       ├── en.json
│   │       └── ar.json
│   ├── page/               # 页面（MPA入口）
│   │   ├── example/        # 一级页面
│   │   │   ├── i18n/       # 页面级翻译
│   │   │   ├── pages/      # 页面组件
│   │   │   ├── router/     # 页面路由
│   │   │   ├── api/        # 页面API
│   │   │   ├── index.html  # HTML入口
│   │   │   └── main.ts     # JS入口
│   │   └── activity/       # 归档目录（仅用于分组）
│   │       └── 2024/       # 二级页面
│   │           ├── i18n/
│   │           ├── pages/
│   │           ├── router/
│   │           ├── api/
│   │           ├── index.html
│   │           └── main.ts
│   ├── plugins/            # 插件
│   ├── stores/             # Pinia stores
│   ├── types/              # TypeScript类型
│   └── utils/              # 工具函数
├── .env                    # 环境变量
├── .env.development        # 开发环境变量
├── .env.test               # 测试环境变量
├── .env.production         # 生产环境变量
└── package.json
```

## 多语言使用

### 配置语言

在 `src/i18n/config.ts` 中配置支持的语言：

```typescript
export const SUPPORTED_LOCALES = ['en', 'zh', 'ar'] as const
export const DEFAULT_LOCALE: LangType = 'en'
export const FALLBACK_LOCALE: LangType = 'en'
```

### 按需加载策略（性能优化）

模板采用智能的按需加载策略，性能提升 67%：

**初始化**：

- 只加载当前用户选择的语言（如 `zh`）
- 不会加载其他未使用的语言（`en`、`ar`）

**Fallback 延迟加载**：

- 仅在遇到缺失翻译 key 时才加载 `en` 兜底语言
- 如果当前语言翻译完整，`en` 永远不会加载

**语言切换动态加载**：

- 切换到新语言时才加载对应的语言文件
- 已加载的语言会被缓存，不会重复请求

### 公共翻译

在 `src/i18n/common/` 下添加对应语言的 JSON 文件

### 页面级翻译

在 `src/page/{页面}/i18n/` 下创建对应语言的 JSON 文件，并在 `index.ts` 中导出：

```typescript
export default {
  zh: () => import('./zh.json'),
  en: () => import('./en.json'),
  ar: () => import('./ar.json'),
}
```

### 在组件中使用

```vue
<script setup lang="ts">
import { useI18n } from '@/composables'

const { t } = useI18n()
</script>

<template>
  <div>{{ t('common.confirm') }}</div>
</template>
```

## URL Query 参数支持

支持通过 `?lang=zh/en/ar` 指定语言，详见 [LANG_QUERY.md](./LANG_QUERY.md)

**语言优先级**: URL query > sessionStorage(DEV) > browser > default(en)

## API 请求

### 核心特性

- ✅ **基于 Axios** - 成熟稳定的 HTTP 客户端
- ✅ **统一拦截** - 请求/响应自动处理
- ✅ **错误处理** - 业务错误码、网络错误统一处理
- ✅ **灵活配置** - 请求级别配置覆盖
- ✅ **类型安全** - 完整 TypeScript 支持

### 基础使用

```typescript
import { http } from '@/services/request'

// GET 请求
const data = await http.get<UserInfo>('/user/123')

// POST 请求
await http.post('/user/update', { name: 'John' })

// PUT 请求
await http.put('/user/123', { status: 'active' })

// DELETE 请求
await http.delete('/user/123')
```

### 高级配置

```typescript
import type { RequestConfig } from '@/utils/request/types'

// 静默请求（不显示错误 Toast）
const data = await http.get('/data', {
  showErrorToast: false,
} as RequestConfig)

// 错误码白名单（忽略特定错误码的 Toast）
const result = await http.post('/action', data, {
  errorCodeWhitelist: [404, 1001],
} as RequestConfig)
```

### 页面 API 定义

在 `src/page/{pageName}/api/index.ts` 中定义：

```typescript
import { http } from '@/services/request'

export interface UserInfo {
  id: number
  name: string
  avatar: string
}

export const getUserInfo = (userId: number) => {
  return http.get<UserInfo>(`/user/${userId}`)
}

export const updateUserInfo = (data: Partial<UserInfo>) => {
  return http.post<void>('/user/update', data)
}
```

### 环境配置

在 `.env.*` 文件中配置：

```env
# API 配置
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT=30000
```

### 错误处理

业务错误自动处理，特殊错误码可自定义：

```typescript
// src/utils/request/errorHandler.ts
if (code === 401) {
  console.warn('[Request] Unauthorized')
  // TODO: 实现 token 刷新或跳转登录
}
```

## 开发工具面板

在开发模式下，页面右下角（RTL模式为左下角）会显示开发工具按钮：

- **语言切换**：快速切换应用语言并重新加载页面
- **Eruda调试**：点击加载 Eruda 移动端调试工具

## rem 适配

项目使用 `13.3333vw` 作为根字体大小（基于 750px 设计稿）：

- 设计稿尺寸 / 100 = rem 值
- 例如：750px = 7.5rem，100px = 1rem，28px = 0.28rem

## RTL 支持

项目集成了 `postcss-rtlcss`，自动处理 RTL 布局：

- 阿拉伯语（ar）自动应用 RTL 布局
- 其他语言使用 LTR 布局
- CSS 属性自动镜像翻转（left/right、padding/margin 等）

## 代码规范

项目使用 ESLint + Prettier 进行代码格式化：

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化代码
pnpm format
```

规范配置：

- 无分号
- 单引号
- 2空格缩进

## License

MIT
