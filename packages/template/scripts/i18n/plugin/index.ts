import type { Plugin, ViteDevServer } from 'vite'
import chalk from 'chalk'
import path from 'path'
import { ZhScanner } from '../core/scanner/zh-scanner'
import { CSVMatcher } from '../core/matcher/csv-matcher'
import { JSONUpdater, convertToUpdateTasks } from '../core/generator/json-updater'
import { CodeReplacer, convertToReplaceTasks } from '../core/generator/code-replacer'
import { defaultI18nConfig } from '../../../config/i18n.config'
import { renderCleanupPage, getCleanupData, executeCleanup, parseBody } from './routes/cleanup'
import { FileUtils } from '../core/utils/file-utils'

export function i18nDevToolsPlugin(): Plugin {
  let actualPort: number = 5173
  let hasChecked = false

  return {
    name: 'i18n-dev-tools',
    apply: 'serve',

    configureServer(server: ViteDevServer) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address()
        if (address && typeof address === 'object') {
          actualPort = address.port
        }

        if (!hasChecked) {
          hasChecked = true
          setTimeout(() => {
            performQuickScan(actualPort)
          }, 2000)
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
              console.error('❌ 导入执行失败:', error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(
                JSON.stringify({
                  success: false,
                  error: error.message || String(error),
                  stack: error.stack,
                })
              )
            }
          })
          return
        }

        // 清理工具界面
        if (url === '/__i18n/cleanup') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          const html = await renderCleanupPage(actualPort)
          res.end(html)
          return
        }

        // 清理工具数据
        if (url === '/__i18n/cleanup/data') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          try {
            const data = await getCleanupData()
            res.end(JSON.stringify(data))
          } catch (error: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
          return
        }

        // 执行清理（POST）
        if (url === '/__i18n/cleanup/exec' && req.method === 'POST') {
          try {
            const body = await parseBody(req)
            const result = await executeCleanup(body.keys || [])
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(result))
          } catch (error: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ success: false, error: error.message }))
          }
          return
        }

        next()
      })
    },
  }
}

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
      console.log(
        '   涉及文件: ' +
          quickScan.files.slice(0, 3).join(', ') +
          (quickScan.files.length > 3 ? '...' : '')
      )
      console.log(`\n   👉 访问工具面板: ${chalk.cyan(`http://localhost:${port}/__i18n`)}`)
      console.log(`   快速操作: ${chalk.cyan(`http://localhost:${port}/__i18n/import`)}`)
    }

    console.log(`\n   📊 工具面板: ${chalk.cyan(`http://localhost:${port}/__i18n`)}`)
  } catch {
    console.log(chalk.yellow('⚠️  快速扫描失败，请访问工具面板查看详情'))
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

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

async function handleImportData() {
  const scanner = new ZhScanner({ srcPath: defaultI18nConfig.srcPath })
  const placeholders = await scanner.scan()

  const matcher = new CSVMatcher({
    csvDir: defaultI18nConfig.csv.directory,
    placeholderRules: defaultI18nConfig.placeholderRules,
  })

  return await matcher.match(placeholders)
}

async function validateTranslations(
  matched: any[],
  srcPath: string
): Promise<{
  valid: boolean
  details: Array<{ page: string; key: string; missingLangs: string[] }>
}> {
  const details: Array<{ page: string; key: string; missingLangs: string[] }> = []

  // 按页面分组
  const groupedByPage = matched.reduce(
    (acc, item) => {
      if (!acc[item.pageName]) {
        acc[item.pageName] = []
      }
      acc[item.pageName].push(item)
      return acc
    },
    {} as Record<string, any[]>
  )

  // 检查每个页面
  for (const [pageName, items] of Object.entries(groupedByPage)) {
    const pagePath = path.join(srcPath, pageName)
    const i18nDir = path.join(pagePath, 'i18n')

    // 获取现有语种
    if (!(await FileUtils.exists(i18nDir))) {
      continue
    }

    const files = await FileUtils.scanFiles(['*.json'], {
      cwd: i18nDir,
      absolute: false,
    })

    const existingLangs = files.map((file) => path.basename(file, '.json')).sort()

    // 检查每个item
    for (const item of items as any[]) {
      const providedLangs = Object.keys(item.translations)
      const missingLangs = existingLangs.filter((lang) => !providedLangs.includes(lang))

      if (missingLangs.length > 0) {
        details.push({
          page: pageName,
          key: item.key,
          missingLangs,
        })
      }
    }
  }

  return {
    valid: details.length === 0,
    details,
  }
}

async function handleImportExec(data: any) {
  try {
    const { matched } = data

    console.log(`\n📥 开始导入 ${matched.length} 个翻译...`)

    const validation = await validateTranslations(matched, defaultI18nConfig.srcPath)

    if (!validation.valid) {
      return {
        success: false,
        blocked: true,
        reason: 'missing_translations',
        message: '检测到缺失翻译，导入已被阻止',
        missingDetails: validation.details,
      }
    }

    const updater = new JSONUpdater()
    const updateTasks = convertToUpdateTasks(matched, defaultI18nConfig.srcPath)
    console.log(`\n📝 更新 JSON 文件...`)
    const updateResult = await updater.update(updateTasks)

    const replacer = new CodeReplacer()
    const replaceTasks = convertToReplaceTasks(matched)
    console.log(`\n🔄 替换代码占位符...`)
    const replaceResult = await replacer.replace(replaceTasks)

    console.log(`\n✅ 导入完成！`)
    console.log(`   文件更新: ${updateResult.filesUpdated + replaceResult.filesUpdated} 个`)
    console.log(`   Keys 添加: ${updateResult.keysAdded} 个`)
    console.log(`   代码替换: ${replaceResult.replacements} 处\n`)

    return {
      success: true,
      filesUpdated: updateResult.filesUpdated + replaceResult.filesUpdated,
      keysAdded: updateResult.keysAdded,
      replacements: replaceResult.replacements,
    }
  } catch (error: any) {
    console.error('\n❌ 导入过程中发生错误:', error)
    throw error
  }
}

function renderDashboard(_port: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>i18n 开发工具</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #383838;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header {
      padding: 1rem 0;
      border-bottom: 1px solid #e5e5e5;
      margin-bottom: 1.5rem;
    }
    .header h1 { 
      font-size: 1.25rem; 
      font-weight: 600;
      color: #171717;
      margin-bottom: 0.25rem;
    }
    .header p { 
      color: #737373;
      font-size: 0.85rem;
    }
    .tools {
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: #e5e5e5;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      overflow: hidden;
    }
    .tool-card {
      background: #fafafa;
      padding: 0.875rem 1rem;
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      gap: 0.875rem;
      transition: background 0.15s ease;
    }
    .tool-card:hover { background: #f5f5f5; }
    .tool-icon { 
      font-size: 1.125rem;
      width: 20px;
      text-align: center;
    }
    .tool-content { flex: 1; }
    .tool-title { 
      font-size: 0.9rem;
      font-weight: 500;
      color: #171717;
      margin-bottom: 0.2rem;
    }
    .tool-desc { 
      color: #737373;
      font-size: 0.8rem;
      line-height: 1.3;
    }
    .badge { 
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-size: 0.7rem;
      font-weight: 500;
      background: #0969da;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌍 i18n 开发工具</h1>
      <p>多语言翻译管理工具</p>
    </div>
    <div class="tools">
      <a href="/__i18n/import" class="tool-card">
        <div class="tool-icon">📥</div>
        <div class="tool-content">
          <div class="tool-title">增量导入</div>
          <div class="tool-desc">扫描代码中的 zh_ 占位符，从 CSV 匹配翻译并自动回填</div>
        </div>
        <span class="badge">使用</span>
      </a>
      <a href="/__i18n/cleanup" class="tool-card">
        <div class="tool-icon">🗑️</div>
        <div class="tool-content">
          <div class="tool-title">清理工具</div>
          <div class="tool-desc">检测并删除未使用的翻译 key</div>
        </div>
        <span class="badge">使用</span>
      </a>
    </div>
  </div>
</body>
</html>`
}

function renderNoPlaceholders(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>增量导入 - i18n 工具</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #383838;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .message { 
      text-align: center;
      max-width: 400px;
      padding: 2rem 1.5rem;
    }
    .message h2 { 
      color: #171717;
      font-size: 1.125rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    .message p {
      color: #737373;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .back-link { 
      display: inline-block;
      padding: 0.4rem 0.875rem;
      background: #0969da;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
      transition: background 0.15s;
    }
    .back-link:hover { background: #0550ae; }
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

function renderImportReport(matchResult: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>增量导入 - i18n 工具</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #383838;
      padding: 1.5rem;
    }
    .container { 
      max-width: 1200px;
      margin: 0 auto;
    }
    .header { 
      padding: 1rem 0;
      border-bottom: 1px solid #e5e5e5;
      margin-bottom: 1.5rem;
    }
    h1 { 
      font-size: 1.25rem;
      font-weight: 600;
      color: #171717;
      margin-bottom: 0.25rem;
    }
    .header p {
      color: #737373;
      font-size: 0.85rem;
    }
    .stats { 
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .stat { 
      padding: 0.75rem;
      background: #f6f8fa;
      border-radius: 4px;
      border: 1px solid #d0d7de;
    }
    .stat-value { 
      font-size: 1.5rem;
      font-weight: 600;
      color: #171717;
    }
    .stat-label { 
      color: #737373;
      font-size: 0.8rem;
      margin-top: 0.2rem;
    }
    .actions-top { 
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding: 0.875rem;
      background: #f6f8fa;
      border: 1px solid #d0d7de;
      border-radius: 4px;
    }
    .section { margin-bottom: 1.5rem; }
    .section h2 { 
      color: #171717;
      margin-bottom: 0.875rem;
      font-size: 0.9rem;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d0d7de;
      border-radius: 4px;
      overflow: hidden;
    }
    thead { background: #f6f8fa; }
    th {
      padding: 0.5rem 0.875rem;
      text-align: left;
      font-weight: 500;
      color: #737373;
      font-size: 0.8rem;
      border-bottom: 1px solid #d0d7de;
    }
    td {
      padding: 0.5rem 0.875rem;
      border-top: 1px solid #e5e5e5;
      background: #ffffff;
      font-size: 0.85rem;
    }
    tbody tr:hover { background: #f6f8fa; }
    code {
      background: #f6f8fa;
      padding: 0.2rem 0.375rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.8rem;
      color: #cf222e;
    }
    code.copyable-key {
      cursor: pointer;
      transition: all 0.15s;
    }
    code.copyable-key:hover {
      background: #0969da;
      color: #ffffff;
    }
    code.copyable-key:active { transform: scale(0.95); }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.35rem;
      background: #0969da;
      color: #ffffff;
      border-radius: 3px;
      font-size: 0.7rem;
      font-weight: 500;
      margin-right: 0.25rem;
    }
    button { 
      padding: 0.4rem 0.875rem;
      border: 1px solid #d0d7de;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-primary { 
      background: #0969da;
      color: white;
      border-color: #0969da;
    }
    .btn-primary:hover { 
      background: #0550ae;
      border-color: #0550ae;
    }
    .btn-secondary { 
      background: #f6f8fa;
      color: #24292f;
    }
    .btn-secondary:hover { 
      background: #f3f4f6;
      border-color: #0969da;
    }
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

    <div class="actions-top">
      <button class="btn-primary" onclick="executeImport()">确认导入 (${matchResult.matched.length} 项)</button>
      ${
        matchResult.unmatched.length > 0
          ? `<button class="btn-secondary" onclick="copyUnmatchedKeys()">📋 复制未匹配 Key (${matchResult.unmatched.length})</button>`
          : ''
      }
    </div>

    <div class="section">
      <h2>📋 翻译列表 (${matchResult.stats.total} 项)</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 45px;">状态</th>
            <th style="width: 20%;">Key</th>
            <th style="width: 25%;">中文</th>
            <th style="width: 20%;">English</th>
            <th>位置/语种</th>
          </tr>
        </thead>
        <tbody>
          ${[...matchResult.matched.slice(0, 50), ...matchResult.unmatched.slice(0, 20)]
            .map((item: any) => {
              const isMatched = item.key && item.translations
              if (isMatched) {
                const langs = Object.keys(item.translations)
                const badges = langs.map((l) => '<span class="badge">' + l + '</span>').join('')
                return `
            <tr>
              <td><span class="badge" style="background: #2da44e;">✓</span></td>
              <td><code class="copyable-key" onclick="copyKey('${item.key}')" title="点击复制">${item.key}</code></td>
              <td>${item.zhText}</td>
              <td>${item.translations.en || '-'}</td>
              <td>${badges}</td>
            </tr>
          `
              } else {
                return `
            <tr>
              <td><span class="badge" style="background: #cf222e;">✗</span></td>
              <td style="color: #737373; font-size: 0.8rem;">-</td>
              <td>${item.zhText}</td>
              <td style="color: #737373;">-</td>
              <td style="font-size: 0.8rem; color: #737373;">${item.filePath}:${item.line}</td>
            </tr>
          `
              }
            })
            .join('')}
        </tbody>
      </table>
      ${matchResult.matched.length + matchResult.unmatched.length > 70 ? `<p style="color: #737373; margin-top: 0.875rem; font-size: 0.85rem;">... 还有 ${matchResult.matched.length + matchResult.unmatched.length - 70} 项</p>` : ''}
    </div>
  </div>

  <script>
    function showToast(message, bgColor = '#2da44e') {
      const toast = document.createElement('div')
      toast.textContent = message
      toast.style.cssText = \`position: fixed; top: 20px; right: 20px; background: \${bgColor}; color: white; padding: 0.6rem 0.875rem; border-radius: 4px; font-size: 0.85rem; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);\`
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    }

    function copyKey(key) {
      navigator.clipboard.writeText(key).then(() => {
        showToast('✓ 已复制: ' + key)
      }).catch(err => {
        showToast('✗ 复制失败: ' + err.message, '#dc2626')
      })
    }

    function copyUnmatchedKeys() {
      const unmatched = ${JSON.stringify(matchResult.unmatched)}
      const keys = unmatched.map(item => 'zh_' + item.zhText).join('\\n')
      
      navigator.clipboard.writeText(keys).then(() => {
        showToast('✓ 已复制 ' + unmatched.length + ' 个未匹配的 Key', '#2da44e')
      }).catch(err => {
        showToast('✗ 复制失败: ' + err.message, '#dc2626')
      })
    }

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

        console.log('导入结果:', result)
        
        if (result.success) {
          alert('✅ 导入成功！\\n\\n' +
            '文件更新: ' + result.filesUpdated + ' 个\\n' +
            'Keys 添加: ' + result.keysAdded + ' 个\\n' +
            '代码替换: ' + result.replacements + ' 处')
          location.reload()
        } else if (result.blocked && result.reason === 'missing_translations') {
          const details = result.missingDetails || []
          let message = '🚫 导入已被阻止！\\n\\n'
          message += '检测到 ' + details.length + ' 个 key 缺少翻译：\\n\\n'
          
          details.slice(0, 10).forEach((item) => {
            message += '• ' + item.key + ' (' + item.page + ')\\n'
            message += '  缺少: ' + item.missingLangs.join(', ') + '\\n'
          })
          
          if (details.length > 10) {
            message += '\\n... 还有 ' + (details.length - 10) + ' 个\\n'
          }
          
          message += '\\n💡 请在 CSV 文件中补充缺失的翻译后重试！'
          alert(message)
          btn.disabled = false
          btn.textContent = '确认导入'
        } else {
          console.error('导入失败，返回对象:', result)
          alert('❌ 导入失败: ' + (result.error || result.message || JSON.stringify(result)))
          btn.disabled = false
          btn.textContent = '确认导入'
        }
      } catch (error) {
        console.error('执行异常:', error)
        alert('❌ 执行失败: ' + error.message)
        btn.disabled = false
        btn.textContent = '确认导入'
      }
    }
  </script>
</body>
</html>`
}
