# i18n 多语言工具使用指南

## 📦 安装依赖

```bash
cd packages/template
pnpm install
```

新增的依赖：

- `fs-extra` - 文件操作
- `fast-glob` - 快速文件扫描
- `papaparse` - CSV 解析
- `chalk` - 终端颜色（已有）
- `ora` - 加载动画（已有）
- `prompts` - 交互式命令行（已有）

## 🚀 快速开始

### 1. 准备翻译 CSV

将翻译 CSV 文件放入 `translations/` 目录。

**CSV 格式要求**：

```csv
key,中文（zh）,English(en),Arabic(ar),Turkish
com_confirm,确认,Confirm,تأكيد,Onayla
vip_privilege_1,激活此权益(%AA天),Activate benefit (%AA days),تفعيل الميزة (%AA أيام),Avantajı etkinleştir (%AA gün)
```

### 2. 开发期间使用 zh\_ 占位符

```vue
<template>
  <button>{{ t('zh_确认') }}</button>
  <div>{{ t('zh_激活此权益') }}</div>
</template>
```

### 3. 测试扫描功能

```bash
# 扫描代码中的 zh_ 占位符
npm run lang:scan
```

这个命令会：

- 扫描所有 zh\_ 占位符
- 尝试匹配 CSV 翻译
- 显示匹配统计

### 4. 启动开发服务器

```bash
npm run dev
```

启动后会自动检测 zh\_ 占位符并提示：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 i18n 工具检测中...

⚠️  发现 23 个 zh_ 占位符待处理
   涉及文件: vip/pages/Home.vue, mall/pages/Product.vue...

   👉 访问工具面板: http://localhost:5173/__i18n
   快速操作: http://localhost:5173/__i18n/import

   📊 工具面板: http://localhost:5173/__i18n
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5. 使用可视化工具

访问 `http://localhost:5173/__i18n`

#### 增量导入功能

1. 访问 `http://localhost:5173/__i18n/import`
2. 查看匹配结果
3. 点击"确认导入"

工具会自动：

- ✅ 更新各语种的 JSON 文件
- ✅ 替换代码中的 `zh_` 占位符为真实 key
- ✅ 显示导入结果

#### 清理未使用的 Key

1. 访问 `http://localhost:5173/__i18n/cleanup`
2. 查看未使用的翻译 key（按页面分组）
3. 选择要删除的 key（默认全选）
4. 点击"Delete Selected"确认删除

工具会自动：

- ✅ 扫描代码中实际使用的 key
- ✅ 对比所有语种 JSON 文件
- ✅ 删除未使用的 key
- ✅ 保持 JSON 文件格式和结构

### 6. 新增语种

```bash
# 添加土耳其语
npm run lang:add tr

# 仅预览（不实际创建文件）
npm run lang:add tr --dry-run

# 指定页面
npm run lang:add tr --pages example,dashboard
```

工具会自动：

- ✅ 读取所有页面的 `en.json` 作为基准
- ✅ 从 CSV 中匹配新语种翻译
- ✅ 生成新语种的 JSON 文件（保持与 en.json 相同的结构）
- ✅ 提示更新 `src/i18n/config.ts` 配置

### 7. 清理未使用的 Key（CLI）

```bash
# 扫描并清理未使用的 key
npm run lang:clean

# 仅预览（不实际删除）
npm run lang:clean --dry-run

# 交互式选择要删除的 key
npm run lang:clean --interactive

# 跳过 git 检查（不推荐）
npm run lang:clean --force
```

**安全机制**：

- ⚠️ 清理前会检查 git 工作区状态
- ⚠️ 如有未提交更改，会提示先 commit 或 stash
- ⚠️ 最终确认后才执行删除

## 📖 功能详解

### 占位符转换规则

默认规则（可在 `config/i18n.config.ts` 中配置）：

1. **%AA → {0}**

   ```
   CSV: "您有 %AA 条消息"
   结果: "您有 {0} 条消息"
   ```

2. **特殊字符转义**

   ```
   CSV: "用户 @name"
   结果: "用户 {'@'}name"
   ```

3. **命名占位符检测**
   ```
   如果检测到 {crystal}, {breakDay} 等
   会提示需要人工确认
   ```

### 命名占位符警告

当 CSV 中包含命名占位符（如 `{crystal}`）时，工具会标记并提示人工确认，因为：

- 命名占位符需要确保所有语种使用相同的名称
- 自动转换可能导致运行时错误

### JSON 嵌套结构处理

工具**完全支持嵌套 JSON 结构**，并能正确区分不同层级的同名 key：

**示例 JSON 结构**：

```json
{
  "example": {
    "useless": "Nested Useless"
  },
  "useless": "Top Level Useless"
}
```

**Key 路径识别**：

- `example.useless` - 嵌套层级的 key
- `useless` - 顶层 key

**工具处理方式**：

1. **扫描时**：使用点号连接的完整路径（`example.useless`）
2. **匹配时**：从 CSV 中查找对应 key
3. **更新时**：保持原始 JSON 结构，正确更新对应路径
4. **清理时**：仅删除未使用的 key，保留嵌套结构

**技术实现**：

- 使用 JSON 扁平化/反扁平化技术
- `flattenJSON()`: `{"a":{"b":"v"}}` → `{"a.b":"v"}`
- `unflattenJSON()`: `{"a.b":"v"}` → `{"a":{"b":"v"}}`

### 多行支持

工具**完全支持多行翻译文本**：

**代码示例**：

```vue
<!-- 单行 -->
<div>{{ t("example.title") }}</div>

<!-- 多行（模板字符串） -->
<div>{{ t(`example.long_text`, 
            { count: 10 }) }}</div>

<!-- 多行（带参数） -->
<button>{{ t(
  "example.button",
  { name: userName }
) }}</button>
```

**CSV 多行文本**：

```csv
key,中文,English
example.desc,"这是第一行
这是第二行","This is line 1
This is line 2"
```

所有扫描、匹配和替换操作都支持多行文本。

## 🛠️ 配置说明

### 配置文件：`config/i18n.config.ts`

```typescript
export const defaultI18nConfig: I18nConfig = {
  // 文件格式（当前仅支持 JSON，TS 对象格式预留）
  format: 'json',

  // 占位符规则（可自定义）
  placeholderRules: [
    {
      pattern: /%([A-Z]{2})/g,
      replacer: (match, letters) => {
        const index = letters.charCodeAt(0) - 65
        return `{${index}}`
      },
    },
    // ... 更多规则
  ],

  // CSV 配置
  csv: {
    directory: './translations',
    columnMapping: {
      zh: ['中文（zh）', '中文', 'zh'],
      en: ['English(en)', 'English', 'en'],
      // ...
    },
  },

  // 源码路径
  srcPath: './src/page',
}
```

## 🔧 可用命令

### CLI 命令

```bash
# 扫描 zh_ 占位符（测试用）
npm run lang:scan

# 新增语种
npm run lang:add <langCode> [--dry-run] [--pages <pages>]
# 示例：
#   npm run lang:add tr
#   npm run lang:add fr --dry-run
#   npm run lang:add de --pages example,dashboard

# 清理未使用的 key
npm run lang:clean [--dry-run] [--interactive] [--force]
# 示例：
#   npm run lang:clean --dry-run     # 仅预览
#   npm run lang:clean --interactive # 交互式选择
#   npm run lang:clean               # 直接清理

# 启动开发服务器（自动启用 i18n 工具）
npm run dev
```

### 可视化工具

开发服务器启动后，访问以下 URL：

```
主面板:       http://localhost:5173/__i18n
增量导入:     http://localhost:5173/__i18n/import
清理工具:     http://localhost:5173/__i18n/cleanup
```

## 📊 工作流程

### 日常增量翻译

```
1. 开发阶段
   - 使用 zh_ 占位符：t("zh_确认")

2. 运营翻译
   - 在飞书/Excel 中完成翻译
   - 下载为 CSV → 保存到 translations/

3. 导入阶段
   - npm run dev
   - 访问 http://localhost:5173/__i18n/import
   - 预览 → 确认导入

4. 完成
   - JSON 文件自动更新
   - 代码自动替换为: t("com_confirm")
   - git diff 查看变更
```

### 新增语种（即将支持）

```
1. 准备阶段
   - 以现有 en.json 为基准
   - 从 CSV 提取新语种翻译

2. 生成阶段
   - npm run lang:add -- tr
   - 为所有页面生成 tr.json

3. 配置更新
   - 更新 src/i18n/config.ts
   - 添加 'tr' 到 SUPPORTED_LOCALES
```

## ⚠️ 注意事项

1. **CSV 文件编码**：必须是 UTF-8
2. **占位符顺序**：确保 %AA, %BB 的顺序与实际参数对应
3. **命名占位符**：需要人工确认所有语种使用相同名称
4. **Git 提交**：导入前建议先提交现有代码，方便回滚

## 🐛 故障排查

### 问题：未找到 CSV 文件

**解决方案**：

```bash
# 检查目录
ls translations/

# 确保至少有一个 .csv 文件
```

### 问题：匹配率低

**原因**：

- CSV 列名不匹配
- 中文内容不完全一致

**解决方案**：

- 检查 CSV 表头是否包含 `中文（zh）` 或 `中文`
- 确保中文内容完全相同（包括空格、标点）

### 问题：端口冲突

**解决方案**：

```bash
# Vite 会自动使用下一个可用端口
# 工具会自动检测并显示正确的端口号
```

## 📚 技术栈

- **fast-glob**: 高性能文件扫描
- **fs-extra**: 增强的文件操作
- **papaparse**: CSV 解析
- **Vite Plugin API**: 开发服务器集成

## 🔮 即将支持

- [ ] 清理未使用的 key
- [ ] 新增语种批量生成
- [ ] 统计面板
- [ ] 复制到云文档功能
- [ ] 格式适配器（支持 TS 对象格式）

## 📝 更新日志

### v1.0.0 (当前)

- ✅ 核心模块完整实现
- ✅ zh\_ 占位符扫描
- ✅ CSV 匹配和导入
- ✅ 自动更新 JSON 和替换代码
- ✅ Vite Plugin 集成
- ✅ 可视化导入界面
- ✅ 启动时智能检测

---

**如有问题，请查看代码注释或联系开发团队**
