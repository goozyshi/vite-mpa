# Changelog

## [1.1.0] - 2025-11-02

### API 请求系统（阶段一：纯 Web，轻量设计）

#### 核心功能

- ✅ **Axios 集成**: 基于 axios@1.6.5 + axios-retry@4.0.0
- ✅ **自动重试**: 网络错误或 5xx 错误自动重试 3 次，延迟递增
- ✅ **超时控制**: 默认 30s，支持环境变量配置
- ✅ **统一拦截器**: 请求/响应自动处理，预留 Bridge 扩展钩子
- ✅ **错误处理**: 业务错误码、网络错误统一处理，支持 Toast 控制
- ✅ **类型安全**: 完整 TypeScript 类型定义

#### 设计理念

- ✅ **轻量封装**: 保持 axios 原有能力，不做过度封装
- ✅ **单一职责**: 域名、错误处理、拦截器独立模块
- ✅ **低耦合**: 零 Bridge 依赖，纯 Web 可用
- ✅ **预留扩展**: 通过钩子接口支持 Bridge 集成（阶段二）

#### 目录结构

```
src/
├── config/domain.ts              # 域名配置管理
├── services/request.ts           # Axios 单例实例
└── utils/request/
    ├── types.ts                  # 类型定义
    ├── interceptors.ts           # 拦截器
    ├── errorHandler.ts           # 错误处理
    └── index.ts                  # 导出
```

#### 环境变量

- ✅ `VITE_API_BASE_URL`: API 基础 URL
- ✅ `VITE_API_TIMEOUT`: 请求超时时间
- ✅ `VITE_CDN_BASE_URL`: CDN 域名
- ✅ `VITE_WS_BASE_URL`: WebSocket 域名
- ✅ `VITE_PROJECT_URL`: 项目域名

#### 页面 API 生成

- ✅ `gen:page` 自动创建 `api/` 目录
- ✅ 提供示例 API 定义模板

---

## [1.0.0] - 2025-11-01

### 依赖库优化

- ✅ **kolorist → chalk**: 更主流的终端颜色库（158M/week vs 2M/week）
- ✅ **fs → fs-extra**: 更强大的文件操作，支持 Promise API
- ✅ **保留 prompts**: 轻量且功能完善，无需 inquirer
- ✅ **新增 ora**: 提供优雅的 loading spinner 动画

### 新增功能

#### 核心功能

- ✅ Vite 5 多页面应用（MPA）架构
- ✅ Vue 3 + TypeScript 5 完整支持
- ✅ 自动扫描和构建多页面
- ✅ 开发服务器页面预览列表

#### 多语言系统

- ✅ vue-i18n 11 集成，使用 JSON 格式
- ✅ 支持 zh/en/ar 三种语言，默认 en
- ✅ 按需加载机制，自动合并公共翻译
- ✅ RTL 自动适配（postcss-rtlcss）
- ✅ 统一语言配置管理

#### 移动端适配

- ✅ rem 适配方案（13.3333vw，750px 设计稿）
- ✅ Vant 4 组件库集成
- ✅ 触摸优化和移动端最佳实践

#### 开发工具

- ✅ 独立开发工具面板
  - 语言切换功能
  - Eruda 调试工具按需加载
  - sessionStorage 级别持久化
  - 早期加载机制（能捕获初始化请求）
- ✅ HMR 热更新
- ✅ TypeScript 类型检查

#### CLI 工具

- ✅ create-vite-mpa 全局脚手架
- ✅ 交互式项目创建
- ✅ gen:page 页面生成器
- ✅ 本地测试支持（pnpm link）

#### 工程化

- ✅ pnpm workspace Monorepo
- ✅ ESLint + Prettier（无分号、单引号）
- ✅ 多环境配置（.env 文件）
- ✅ 构建优化（Terser、代码分割）

#### 多语言增强

- ✅ URL query 参数支持 (`?lang=zh/en/ar`)
- ✅ 语言切换自动同步到 URL
- ✅ 支持分享带语言的链接
- ✅ 优先级：URL > sessionStorage(DEV) > browser > default(en)

### 技术栈

- Vite 5.0.12
- Vue 3.4.15
- TypeScript 5.3.3
- Vant 4.9.0
- vue-i18n 11.0.0
- Vue Router 4.2.5
- Pinia 2.1.7
- axios 1.6.5
- postcss-rtlcss 5.3.0
- Sass 1.70.0

### 改进优化

#### Eruda 调试工具

- 修复：切换语言后 Eruda 消失的问题
- 新增：sessionStorage 级别持久化
- 新增：自动早期加载机制
- 新增：能捕获页面初始化时的所有请求

#### 多语言方案

- 改进：使用 JSON 格式替代 TS 格式
- 改进：简化 setupI18n API
- 改进：自动合并公共翻译
- 改进：统一语言配置管理

#### CLI 工具

- 修复：ESM 模块导入路径问题
- 改进：模板文件复制逻辑
- 新增：本地测试文档

### 文档

- ✅ 项目主文档（README.md）
- ✅ 本地测试指南（LOCAL_TEST.md）
- ✅ 贡献指南（CONTRIBUTING.md）
- ✅ 更新日志（CHANGELOG.md）
- ✅ MIT 许可证

### 已知问题

无

### 下一步计划

- [ ] 单元测试覆盖
- [ ] E2E 测试
- [ ] 性能监控集成
- [ ] Sentry 错误追踪（可选）
- [ ] PWA 支持（可选）
- [ ] 发布到 npm
