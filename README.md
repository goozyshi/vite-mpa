# vite-mpa

> 基于 Vite5 + Vue3 + TypeScript 的现代化 MPA（多页面应用）模板项目

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange)](https://pnpm.io/)

## ✨ 特性

- ⚡️ **Vite 5** - 极速的开发体验与 HMR
- 🖖 **Vue 3** - 组合式 API
- 🔥 **TypeScript 5** - 类型安全，智能提示
- 🌍 **多语言支持** - zh/en/ar，按需加载，自动合并公共翻译
- 📱 **rem 适配** - 基于 750px 设计稿（13.3333vw）
- 🎨 **Vant 4** - 轻量级移动端 Vue 组件库
- 🔄 **RTL 自动适配** - postcss-rtlcss **自动处理阿语样式**等
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
#  本地
cd packages/cli
pnpm link --global
create-vite-mpa <project-name>

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
│       │   ├── i18n.config.ts  # i18n 工具配置
│       │   ├── pages.ts        # 页面构建配置
│       │   ├── vite.base.ts
│       │   ├── vite.build.ts
│       │   └── vite.dev.ts
│       ├── scripts/            # 脚本工具
│       │   ├── build.ts        # 构建脚本
│       │   ├── gen-page.ts     # 页面生成器
│       │   ├── i18n/           # 多语言工具链
│       │   │   ├── cli/        # CLI 命令
│       │   │   │   ├── scan.ts      # 扫描 zh_ 占位符
│       │   │   │   ├── clean.ts     # 清理无用 key
│       │   │   │   └── add-lang.ts  # 添加新语言
│       │   │   ├── core/       # 核心逻辑
│       │   │   │   ├── scanner/     # 代码扫描器
│       │   │   │   ├── matcher/     # CSV 匹配器
│       │   │   │   ├── generator/   # 代码/JSON 生成器
│       │   │   │   ├── cleaner/     # Key 清理器
│       │   │   │   ├── adapters/    # 格式适配器
│       │   │   │   └── utils/       # 工具函数
│       │   │   └── plugin/     # Vite 开发插件
│       │   │       ├── index.ts     # 开发工具路由
│       │   │       └── routes/      # 增量导入/清理页面
│       │   ├── preview/        # 开发预览
│       │   └── utils/          # 通用工具
│       ├── src/
│       │   ├── assets/         # 静态资源
│       │   │   └── css/        # 全局样式
│       │   ├── components/     # 公共组件
│       │   │   └── DevToolsPanel/  # 开发工具面板
│       │   ├── composables/    # 组合式函数
│       │   │   └── useLang.ts  # 语言切换
│       │   ├── config/         # 配置文件
│       │   │   └── domain.ts   # 域名配置
│       │   ├── i18n/           # 国际化配置
│       │   │   ├── common/     # 公共翻译
│       │   │   ├── config.ts   # i18n 配置
│       │   │   └── index.ts    # i18n 实例
│       │   ├── page/           # 页面（MPA 入口）
│       │   │   └── example/
│       │   │       ├── api/         # API 定义
│       │   │       ├── i18n/        # 页面级翻译
│       │   │       ├── pages/       # 页面组件
│       │   │       ├── router/      # 路由配置
│       │   │       ├── src/types/   # 页面类型
│       │   │       ├── index.html
│       │   │       └── main.ts
│       │   ├── plugins/        # Vue 插件
│       │   ├── services/       # API 服务
│       │   │   └── request.ts  # 请求封装
│       │   ├── stores/         # Pinia stores
│       │   ├── types/          # TS 类型定义
│       │   └── utils/          # 工具函数
│       │       ├── eruda.ts    # Eruda 调试工具
│       │       └── request/    # 请求工具
│       ├── translations/       # CSV 翻译文件
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

## 🔄 多语言开发工作流

### 完整流程

```mermaid
graph LR
    A[编写代码] --> B[使用 zh_ 占位符]
    B --> C[扫描占位符]
    C --> D[导出 CSV]
    D --> E[翻译团队翻译]
    E --> F[增量导入 CSV]
    F --> G[自动替换占位符]
    G --> H[生成多语言 JSON]
    H --> I[清理无用 Key]
```

### 1️⃣ 开发阶段 - 使用占位符

在代码中使用**t函数** `zh_` 前缀的中文占位符：

```vue
<template>
  <!-- ✅ 推荐：使用 zh_ 占位符 -->
  <div>{{ t("zh_确认") }}</div>
  <van-button>{{ t("zh_提交订单") }}</van-button>
</template>
```

**命名规则**：

- ✅ `zh_确认`
- ✅ `zh_提交订单`
- ✅ `zh_用户信息_昵称`
- ❌ `zh_`（空内容）
- ❌ `确认`（无 zh\_ 前缀）

### 2️⃣ 扫描阶段 - 发现占位符

运行扫描命令：

```bash
pnpm i18n:scan
```

**扫描结果**：

- 自动识别所有 `zh_` 占位符
- 生成建议的 key 名称（如 `zh_确认` → `common.confirm`）
- 按页面分组显示

**配置扫描范围**：

在 `config/pages.ts` 中指定要扫描的页面：

```typescript
export const buildPages: RegExp[] = [
  /vip/, // 仅扫描 vip 页面
  /example/, // 扫描 example 页面
  // [] 表示扫描所有页面
];
```

### 3️⃣ 翻译阶段 - CSV 文件

将中文文本交给翻译团队，返回 CSV 格式：

**CSV 格式示例**：

```csv
中文,en,ar
确认,Confirm,تأكيد
提交订单,Submit Order,إرسال الطلب
```

**放置位置**：`translations/` 目录

### 4️⃣ 导入阶段 - 增量更新

访问 **增量导入页面**：http://localhost:5173/\_\_i18n/import

**导入流程**：

1. 自动匹配 CSV 中的中文与代码中的占位符
2. 生成建议的 key 名称
3. 显示匹配状态（✅ 已有 key / ⚠️ 新 key）
4. 点击"确认导入"执行替换

**自动操作**：

- ✅ 替换代码中的 `zh_` 占位符为正式 key
- ✅ 更新 `zh.json`、`en.json`、`ar.json`
- ✅ 仅更新已存在的语言文件（跳过未接入语言）
- ✅ 保留已有翻译，仅追加新 key

**导入示例**：

导入前：

```vue
<div>{{ t('zh_确认') }}</div>
```

导入后：

```vue
<div>{{ t('common.confirm') }}</div>
```

对应 JSON：

```json
{
  "common": {
    "confirm": "确认"  // zh.json
    "confirm": "Confirm"  // en.json
    "confirm": "تأكيد"  // ar.json
  }
}
```

### 5️⃣ 清理阶段 - 移除无用 Key

访问 **Key 清理页面**：http://localhost:5173/\_\_i18n/cleanup

或运行命令：

```bash
pnpm i18n:clean
```

**清理逻辑**：

1. 扫描所有代码中使用的 key
2. 对比 JSON 文件中定义的 key
3. 标记未被使用的 key
4. 点击"确认清理"删除无用 key

**安全保障**：

- ✅ 仅删除完全未使用的 key
- ✅ 显示详细的删除列表
- ✅ 支持手动复制 key（点击 key 复制）

### 6️⃣ 添加新语言

运行命令：

```bash
pnpm i18n:add-lang
```

按提示输入：

1. 语言代码（如 `fr`）
2. 语言名称（如 `Français`）

**自动操作**：

- ✅ 更新 `src/i18n/config.ts` 语言列表
- ✅ 创建 `src/i18n/common/{lang}.json`
- ✅ 为所有页面创建 `i18n/{lang}.json`
- ✅ 更新类型定义

### 📋 最佳实践

#### 占位符命名

```typescript
// ✅ 好的命名
t("zh_确认");
t("zh_用户信息_昵称");
t("zh_订单状态_待支付");

// ❌ 避免
t("zh_"); // 空内容
t("zh_啊"); // 无意义
t("zh_这是一段很长的文字..."); // 太长
```

#### CSV 管理

- 一个功能模块一个 CSV 文件
- 文件名包含版本号（如 `v2.0.0.csv`）
- 放在 `translations/` 目录统一管理

#### 页面配置

```typescript
// config/pages.ts

// 开发阶段：仅构建当前页面
export const buildPages: RegExp[] = [/vip/];

// 提测阶段：构建所有页面
export const buildPages: RegExp[] = [];
```

### 🎯 工具特性

| 特性         | 说明                             |
| ------------ | -------------------------------- |
| **增量导入** | 仅更新变更的 key，不覆盖已有翻译 |
| **智能匹配** | 自动匹配 CSV 中文与代码占位符    |
| **页面过滤** | 仅处理 `buildPages` 配置的页面   |
| **语言过滤** | 仅更新项目已接入的语言文件       |
| **点击复制** | 所有 key 支持点击复制            |
| **批量复制** | 一键复制所有未匹配的 key         |
| **实时预览** | 可视化查看导入/清理结果          |
| **性能优化** | 缓存机制，避免重复扫描           |

## 🌐 API 请求

### 核心特性

- ✅ **基于 Axios** - 自动重试、超时控制（30s）
- ✅ **统一拦截** - 请求/响应自动处理
- ✅ **错误处理** - 业务错误码、网络错误统一处理
- ✅ **灵活配置** - 请求级别配置覆盖
- ✅ **类型安全** - 完整 TypeScript 支持
- ✅ **预留扩展** - 支持 Bridge 集成（阶段二）

### 基础使用

```typescript
import { http } from "@/services/request";

// GET 请求
const data = await http.get<UserInfo>("/user/123");

// POST 请求
await http.post("/user/update", { name: "John" });

// PUT 请求
await http.put("/user/123", { status: "active" });

// DELETE 请求
await http.delete("/user/123");
```

### 高级配置

```typescript
import type { RequestConfig } from "@/utils/request/types";

// 静默请求（不显示错误 Toast）
const data = await http.get("/data", {
  showErrorToast: false,
} as RequestConfig);

// 错误码白名单（忽略特定错误码的 Toast）
const result = await http.post("/action", data, {
  errorCodeWhitelist: [404, 1001],
} as RequestConfig);
```

### 页面 API 定义

在 `src/page/{pageName}/api/index.ts` 中定义：

```typescript
import { http } from "@/services/request";

export interface UserInfo {
  id: number;
  name: string;
  avatar: string;
}

export const getUserInfo = (userId: number) => {
  return http.get<UserInfo>(`/user/${userId}`);
};

export const updateUserInfo = (data: Partial<UserInfo>) => {
  return http.post<void>("/user/update", data);
};
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
  console.warn("[Request] Unauthorized");
  // 实现 token 刷新或跳转登录
}
```

## 🛠️ 开发工具

### 开发工具面板

开发/测试环境下，页面右下角显示一个小圆点（触摸区域 44x44px）：

- **语言切换** - 实时切换应用语言（下拉选择）
- **刷新页面** - 快速刷新当前页面
- **Eruda 调试** - 移动端调试工具，按需加载，支持缓存
- **复制 Token** - 一键复制 localStorage/sessionStorage 中的认证 token
- **清理缓存** - 清除开发相关的本地缓存

### 页面预览

访问 http://localhost:5173 可以查看所有页面列表：

- 按首字母分组
- 简洁清晰的卡片布局
- 点击直接访问

### 多语言开发工具

#### 可视化开发界面

启动开发服务器后，可通过以下页面管理多语言：

| 工具页面       | 路径                                   | 功能                   |
| -------------- | -------------------------------------- | ---------------------- |
| **开发仪表盘** | http://localhost:5173                  | 页面列表预览           |
| **增量导入**   | http://localhost:5173/\_\_i18n/import  | CSV 翻译导入，自动匹配 |
| **Key 清理**   | http://localhost:5173/\_\_i18n/cleanup | 检测无用翻译 key       |

#### CLI 命令

```bash
# 扫描代码中的 zh_ 占位符
pnpm i18n:scan

# 清理无用的翻译 key
pnpm i18n:clean

# 添加新语言支持
pnpm i18n:add-lang
```

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

## 🚧 计划中的功能

### 国际化增强

- [ ] **缺失翻译检测** - 自动标记未翻译内容

### 构建优化

- [ ] **增量构建** - 基于 Git diff 仅构建变更页面
- [ ] **构建缓存** - 加速二次构建
- [ ] **资源优化** - 图片自动压缩、CDN 上传
- [ ] **产物分析** - 可视化构建体积分析

### 开发工具

- [ ] **Mock 系统** - 内置 Mock 服务器与数据管理
- [ ] **组件文档** - 组件库文档自动生成

### 部署 & 监控

- [ ] **性能监控** - Core Web Vitals 追踪
- [ ] **错误追踪** - Sentry 集成

### CLI 增强

- [ ] **组件生成器** - 快速创建组件模板
- [ ] **依赖管理** - 版本检查与升级工具

## 📄 License

[MIT](./LICENSE) © 2025

## 🔗 相关链接

- [Vite](https://vitejs.dev/)
- [Vue 3](https://vuejs.org/)
- [Vant](https://vant-ui.github.io/)
- [vue-i18n](https://vue-i18n.intlify.dev/)
- [postcss-rtlcss](https://github.com/elchininet/postcss-rtlcss)
