import type { Plugin, ViteDevServer } from 'vite'
import chalk from 'chalk'
import { ZhScanner } from '../core/scanner/zh-scanner'
import { CSVMatcher } from '../core/matcher/csv-matcher'
import { JSONUpdater, convertToUpdateTasks } from '../core/generator/json-updater'
import { CodeReplacer, convertToReplaceTasks } from '../core/generator/code-replacer'
import { defaultI18nConfig } from '../../../config/i18n.config'

/**
 * i18n 开发工具插件
 * 特点：
 * 1. 启动时不执行重逻辑（不扫描、不分析）
 * 2. 只注册路由，按需执行
 * 3. 轻量级，不影响启动速度
 */
export function i18nDevToolsPlugin(): Plugin {
  let actualPort: number = 5173
  let hasChecked = false

  return {
    name: 'i18n-dev-tools',
    apply: 'serve',

    configureServer(server: ViteDevServer) {
      // 获取真实端口
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address()
        if (address && typeof address === 'object') {
          actualPort = address.port
        }

        // 执行快速扫描
        if (!hasChecked) {
          hasChecked = true
          performQuickScan(actualPort)
        }
      })

      // 注册路由
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''

        // 主面板
        if (url === '/__i18n') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(renderDashboard(actualPort))
          return
        }

        // 导入工具
        if (url === '/__i18n/import') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          const html = await handleImport()
          res.end(html)
          return
        }

        // 导入数据（JSON）
        if (url === '/__i18n/import/data') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          const data = await handleImportData()
          res.end(JSON.stringify(data))
          return
        }

        // 执行导入（POST）
        if (url === '/__i18n/import/exec' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', async () => {
            try {
              const result = await handleImportExec(JSON.parse(body))
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify(result))
            } catch (error: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ success: false, error: error.message }))
            }
          })
          return
        }

        next()
      })
    },
  }
}

/**
 * 快速扫描并打印提示
 */
async function performQuickScan(port: number) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🌍 i18n 工具检测中...')

  try {
    const scanner = new ZhScanner({ srcPath: defaultI18nConfig.srcPath })
    const quickScan = await scanner.quickScan()

    if (quickScan.count === 0) {
      console.log('✅ 未发现待处理的 zh_ 占位符')
    } else {
      console.log(`\n⚠️  发现 ${quickScan.count} 个 zh_ 占位符待处理`)
      console.log('   涉及文件: ' + quickScan.files.slice(0, 3).join(', ') + (quickScan.files.length > 3 ? '...' : ''))
      console.log(`\n   👉 访问工具面板: ${chalk.cyan(`http://localhost:${port}/__i18n`)}`)
      console.log(`   快速操作: ${chalk.cyan(`http://localhost:${port}/__i18n/import`)}`)
    }

    console.log(`\n   📊 工具面板: ${chalk.cyan(`http://localhost:${port}/__i18n`)}`)
  } catch (error) {
    console.log(chalk.yellow('⚠️  快速扫描失败，请访问工具面板查看详情'))
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

/**
 * 处理导入请求
 */
async function handleImport(): Promise<string> {
  const scanner = new ZhScanner({ srcPath: defaultI18nConfig.srcPath })
  const placeholders = await scanner.scan()

  if (placeholders.length === 0) {
    return renderNoPlaceholders()
  }

  const matcher = new CSVMatcher({
    csvDir: defaultI18nConfig.csv.directory,
    placeholderRules: defaultI18nConfig.placeholderRules,
  })

  const matchResult = await matcher.match(placeholders)

  return renderImportReport(matchResult)
}

/**
 * 获取导入数据
 */
async function handleImportData() {
  const scanner = new ZhScanner({ srcPath: defaultI18nConfig.srcPath })
  const placeholders = await scanner.scan()

  const matcher = new CSVMatcher({
    csvDir: defaultI18nConfig.csv.directory,
    placeholderRules: defaultI18nConfig.placeholderRules,
  })

  return await matcher.match(placeholders)
}

/**
 * 执行导入
 */
async function handleImportExec(data: any) {
  const { matched } = data

  // 更新 JSON
  const updater = new JSONUpdater()
  const updateTasks = convertToUpdateTasks(matched, defaultI18nConfig.srcPath)
  const updateResult = await updater.update(updateTasks)

  // 替换代码
  const replacer = new CodeReplacer()
  const replaceTasks = convertToReplaceTasks(matched)
  const replaceResult = await replacer.replace(replaceTasks)

  return {
    success: true,
    filesUpdated: updateResult.filesUpdated + replaceResult.filesUpdated,
    keysAdded: updateResult.keysAdded,
    replacements: replaceResult.replacements,
  }
}

/**
 * 渲染主面板
 */
function renderDashboard(port: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>i18n 开发工具</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      color: white;
      padding: 2rem;
      text-align: center;
      margin-bottom: 2rem;
    }
    .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .header p { opacity: 0.9; font-size: 1.1rem; }
    .tools {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .tool-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    .tool-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .tool-icon { font-size: 3rem; margin-bottom: 1rem; }
    .tool-title { font-size: 1.5rem; margin-bottom: 0.5rem; color: #667eea; }
    .tool-desc { color: #6b7280; margin-bottom: 1rem; line-height: 1.6; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px;
      font-size: 0.875rem; font-weight: 600; background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌍 i18n 开发工具</h1>
      <p>多语言翻译管理工具 - 统一入口</p>
    </div>
    <div class="tools">
      <a href="/__i18n/import" class="tool-card">
        <div class="tool-icon">📥</div>
        <h3 class="tool-title">增量导入</h3>
        <p class="tool-desc">扫描代码中的 zh_ 占位符，从 CSV 匹配翻译并自动回填</p>
        <span class="badge">点击使用</span>
      </a>
      <div class="tool-card" style="opacity: 0.6; cursor: not-allowed;">
        <div class="tool-icon">🧹</div>
        <h3 class="tool-title">清理工具</h3>
        <p class="tool-desc">检测并删除未使用的翻译 key</p>
        <span class="badge" style="background: #fef3c7; color: #92400e;">开发中</span>
      </div>
      <div class="tool-card" style="opacity: 0.6; cursor: not-allowed;">
        <div class="tool-icon">📊</div>
        <h3 class="tool-title">统计面板</h3>
        <p class="tool-desc">查看翻译覆盖率和统计数据</p>
        <span class="badge" style="background: #fef3c7; color: #92400e;">开发中</span>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * 渲染无占位符页面
 */
function renderNoPlaceholders(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>增量导入 - i18n 工具</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 2rem; }
    .message { text-align: center; padding: 3rem; background: #f0fdf4; border-radius: 12px; }
    .message h2 { color: #16a34a; margin-bottom: 1rem; }
    .back-link { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem;
      background: #667eea; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="message">
    <h2>✅ 未发现 zh_ 占位符</h2>
    <p>代码中没有待处理的翻译占位符</p>
    <a href="/__i18n" class="back-link">返回主面板</a>
  </div>
</body>
</html>`
}

/**
 * 渲染导入报告（简化版）
 */
function renderImportReport(matchResult: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>增量导入 - i18n 工具</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5; padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; background: white;
      border-radius: 12px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; }
    h1 { color: #111827; margin-bottom: 0.5rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem; margin-bottom: 2rem; }
    .stat { padding: 1rem; background: #f9fafb; border-radius: 8px; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #667eea; }
    .stat-label { color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem; }
    .section { margin-bottom: 2rem; }
    .section h2 { color: #374151; margin-bottom: 1rem; font-size: 1.25rem; }
    .item { padding: 1rem; background: #f9fafb; border-radius: 8px; margin-bottom: 0.5rem; }
    .item-zh { font-weight: 600; color: #111827; }
    .item-key { color: #667eea; font-family: monospace; }
    .item-en { color: #6b7280; }
    .actions { display: flex; gap: 1rem; padding-top: 2rem; border-top: 2px solid #e5e7eb; }
    button { padding: 0.75rem 1.5rem; border: none; border-radius: 8px;
      font-size: 1rem; cursor: pointer; transition: all 0.3s; }
    .btn-primary { background: #667eea; color: white; }
    .btn-primary:hover { background: #5568d3; }
    .btn-secondary { background: #e5e7eb; color: #374151; }
    .btn-secondary:hover { background: #d1d5db; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📥 增量翻译导入</h1>
      <p>从 CSV 匹配翻译并自动更新 JSON 文件</p>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-value">${matchResult.stats.total}</div>
        <div class="stat-label">总占位符</div>
      </div>
      <div class="stat">
        <div class="stat-value">${matchResult.stats.matchedCount}</div>
        <div class="stat-label">已匹配</div>
      </div>
      <div class="stat">
        <div class="stat-value">${matchResult.stats.matchRate}%</div>
        <div class="stat-label">匹配率</div>
      </div>
      <div class="stat">
        <div class="stat-value">${matchResult.stats.unmatchedCount}</div>
        <div class="stat-label">未匹配</div>
      </div>
    </div>

    ${matchResult.matched.length > 0 ? `
    <div class="section">
      <h2>✅ 已匹配 (${matchResult.matched.length})</h2>
      ${matchResult.matched.slice(0, 10).map((item: any) => `
        <div class="item">
          <div class="item-zh">${item.zhText}</div>
          <div class="item-key">→ ${item.key}</div>
          ${item.translations.en ? `<div class="item-en">en: ${item.translations.en}</div>` : ''}
        </div>
      `).join('')}
      ${matchResult.matched.length > 10 ? `<p style="color: #6b7280; margin-top: 1rem;">... 还有 ${matchResult.matched.length - 10} 项</p>` : ''}
    </div>
    ` : ''}

    ${matchResult.unmatched.length > 0 ? `
    <div class="section">
      <h2>⚠️ 未匹配 (${matchResult.unmatched.length})</h2>
      ${matchResult.unmatched.slice(0, 5).map((item: any) => `
        <div class="item">
          <div class="item-zh">${item.zhText}</div>
          <div class="item-en" style="font-size: 0.875rem;">${item.filePath}:${item.line}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="actions">
      <button class="btn-primary" onclick="executeImport()">确认导入 (${matchResult.matched.length} 项)</button>
      <a href="/__i18n" class="btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center;">返回</a>
    </div>
  </div>

  <script>
    async function executeImport() {
      if (!confirm('确认导入 ${matchResult.matched.length} 项翻译？\\n\\n这将更新 JSON 文件并替换代码中的占位符。')) {
        return
      }

      const btn = event.target
      btn.disabled = true
      btn.textContent = '导入中...'

      try {
        const response = await fetch('/__i18n/import/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(${JSON.stringify({ matched: matchResult.matched })})
        })

        const result = await response.json()

        if (result.success) {
          alert('✅ 导入成功！\\n\\n' +
            '文件更新: ' + result.filesUpdated + ' 个\\n' +
            'Keys 添加: ' + result.keysAdded + ' 个\\n' +
            '代码替换: ' + result.replacements + ' 处')
          location.reload()
        } else {
          alert('❌ 导入失败: ' + result.error)
          btn.disabled = false
          btn.textContent = '确认导入'
        }
      } catch (error) {
        alert('❌ 执行失败: ' + error.message)
        btn.disabled = false
        btn.textContent = '确认导入'
      }
    }
  </script>
</body>
</html>`
}

