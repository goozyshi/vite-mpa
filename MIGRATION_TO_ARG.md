# 迁移说明：从 minimist/commander 到 arg

## 📋 变更摘要

已将所有 CLI 参数解析从 `minimist` 和 `commander` 统一迁移到 **`arg`** 库。

### 为什么选择 arg？

| 特性 | arg | minimist | commander |
|------|-----|----------|-----------|
| 包体积 | ~7KB | ~5KB | ~30KB |
| 依赖数量 | 0 | 0 | 0 |
| TypeScript 支持 | ✅ 原生 | ⚠️ 需要 @types | ✅ 内置 |
| 类型安全 | ✅ 强类型 | ❌ 弱类型 | ⚠️ 中等 |
| 别名支持 | ✅ | ✅ | ✅ |
| 学习曲线 | 平缓 | 极简 | 中等 |
| 社区活跃度 | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

**arg** 是一个现代的、类型安全的 CLI 参数解析库，相比 minimist 提供了更好的类型支持，相比 commander 更加轻量。

---

## 🔄 需要执行的操作

### 步骤 1: 安装依赖

```bash
# 进入项目根目录
cd /Users/mico/vite-mpa

# 安装依赖
pnpm install
```

这会自动安装 `arg` 到以下包：
- ✅ `packages/cli` - CLI 工具
- ✅ `packages/template` - 模板项目

### 步骤 2: 验证安装

```bash
# 进入 template 目录
cd packages/template

# 测试帮助命令
npm run lang:add -- --help
npm run lang:clean -- --help

# 测试功能
npm run lang:scan
```

---

## 📝 修改的文件清单

### 1. 依赖文件

**packages/cli/package.json**
```diff
- "minimist": "^1.2.8"
- "@types/minimist": "^1.2.5"
+ "arg": "^5.0.2"
```

**packages/template/package.json**
```diff
+ "arg": "^5.0.2"
```

### 2. CLI 文件

**packages/cli/src/index.ts**
```diff
- import minimist from "minimist"
- const argv = minimist(process.argv.slice(2))
- if (argv.help || argv.h) {

+ import arg from 'arg'
+ const argv = arg({
+   '--help': Boolean,
+   '-h': '--help',
+ })
+ if (argv['--help']) {
```

**packages/template/scripts/i18n/cli/add-lang.ts**
```diff
- import { Command } from 'commander'
- const program = new Command()
- program
-   .name('lang:add')
-   .argument('<langCode>')
-   .option('--dry-run')
-   .parse()

+ import arg from 'arg'
+ const args = arg({
+   '--dry-run': Boolean,
+   '--pages': String,
+   '--help': Boolean,
+ })
+ if (args['--help']) {
+   // 显示帮助
+ }
```

**packages/template/scripts/i18n/cli/clean.ts**
```diff
- import { Command } from 'commander'
- const program = new Command()

+ import arg from 'arg'
+ const args = arg({
+   '--dry-run': Boolean,
+   '--interactive': Boolean,
+   '--force': Boolean,
+   '-d': '--dry-run',
+   '-i': '--interactive',
+   '-f': '--force',
+ })
```

---

## 🎯 新增功能

### 1. 内置帮助信息

所有 CLI 命令现在都支持 `--help` 参数：

```bash
# 查看帮助
npm run lang:add -- --help
npm run lang:clean -- --help
```

**输出示例**：
```
Usage: npm run lang:add <langCode> [options]

Arguments:
  langCode              Language code (e.g., tr, fr, de)

Options:
  --csv-dir <path>      CSV directory (default: ./translations)
  --dry-run            Preview only, do not create files
  --pages <names>       Specific pages (comma separated)
  --help, -h           Show help

Examples:
  npm run lang:add tr
  npm run lang:add fr --dry-run
  npm run lang:add de --pages example,dashboard
```

### 2. 短别名支持

现在支持短选项别名：

```bash
# 长选项
npm run lang:clean -- --dry-run --interactive

# 短选项（新增）
npm run lang:clean -- -d -i
```

### 3. 更好的类型安全

`arg` 提供了强类型支持，在开发时能更早发现参数错误：

```typescript
const args = arg({
  '--dry-run': Boolean,  // 类型明确
  '--pages': String,     // 类型明确
})

// TypeScript 会检查类型
const dryRun: boolean = args['--dry-run'] || false  // ✅
const pages: string = args['--pages'] || ''          // ✅
```

---

## 🧪 测试验证

### 测试命令

```bash
cd packages/template

# 1. 测试帮助
npm run lang:add -- --help
npm run lang:clean -- --help

# 2. 测试扫描
npm run lang:scan

# 3. 测试新增语种（dry-run）
npm run lang:add tr -- --dry-run

# 4. 测试清理（dry-run）
npm run lang:clean -- --dry-run

# 5. 测试短别名
npm run lang:clean -- -d -i
```

### 预期结果

所有命令都应该正常工作，并且：
- ✅ 参数解析正确
- ✅ 帮助信息显示正常
- ✅ 短别名工作正常
- ✅ 无类型错误

---

## ⚠️ 注意事项

### 1. 参数访问方式变化

**之前（minimist/commander）**：
```typescript
argv.dryRun  // 驼峰式
options.dryRun
```

**现在（arg）**：
```typescript
args['--dry-run']  // kebab-case with --
```

### 2. 位置参数

```typescript
// 之前
argv._[0]

// 现在
args._[0]  // 相同
```

### 3. 需要显式定义所有选项

`arg` 要求预先定义所有可能的选项，这提高了类型安全性：

```typescript
const args = arg({
  // 必须预先定义
  '--dry-run': Boolean,
  '--pages': String,
})

// 未定义的选项会抛出错误
// args['--unknown']  // ❌ 错误
```

---

## 📚 API 对比

### minimist

```typescript
import minimist from 'minimist'
const argv = minimist(process.argv.slice(2))

console.log(argv._)        // 位置参数
console.log(argv.dryRun)   // 弱类型，可能是任何类型
```

### commander

```typescript
import { Command } from 'commander'
const program = new Command()

program
  .option('--dry-run')
  .parse()

const options = program.opts()
console.log(options.dryRun)  // boolean | undefined
```

### arg (现在使用)

```typescript
import arg from 'arg'
const args = arg({
  '--dry-run': Boolean,  // 强类型定义
  '-d': '--dry-run',     // 别名
})

console.log(args._)            // string[]
console.log(args['--dry-run']) // boolean | undefined (强类型)
```

---

## 🔗 相关资源

- **arg GitHub**: https://github.com/vercel/arg
- **arg npm**: https://www.npmjs.com/package/arg
- **Vercel 官方维护**：由 Next.js 团队维护，质量保证

---

## ✅ 迁移完成清单

- [x] 更新 `packages/cli/package.json`
- [x] 更新 `packages/template/package.json`
- [x] 修改 `packages/cli/src/index.ts`
- [x] 修改 `scripts/i18n/cli/add-lang.ts`
- [x] 修改 `scripts/i18n/cli/clean.ts`
- [x] 添加内置帮助信息
- [x] 添加短别名支持
- [x] 修复类型错误
- [x] 更新文档

---

## 🚀 下一步

1. **安装依赖**：
   ```bash
   cd /Users/mico/vite-mpa
   pnpm install
   ```

2. **测试功能**：
   ```bash
   cd packages/template
   npm run lang:add -- --help
   npm run lang:clean -- --help
   npm run lang:scan
   ```

3. **验证完成后**，可以删除此文件：
   ```bash
   rm MIGRATION_TO_ARG.md
   ```

---

**迁移完成！享受更好的 CLI 参数解析体验！** 🎉

