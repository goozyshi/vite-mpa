/**
 * 清理工具的可视化界面
 * 路由：/__i18n/cleanup
 */

import type { IncomingMessage } from 'http'
import { KeyCleaner, UnusedKeyInfo } from '../../core/cleaner/key-cleaner'

/**
 * 渲染清理工具界面
 */
export async function renderCleanupPage(_port: number): Promise<string> {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🗑️ i18n Key Cleanup</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #383838;
      min-height: 100vh;
      padding: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      padding: 1.5rem 0;
      border-bottom: 1px solid #e5e5e5;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    h1 { 
      font-size: 1.5rem;
      font-weight: 600;
      color: #171717;
    }
    
    .stats {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
      color: #737373;
    }
    
    .stats span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .stats strong { 
      font-weight: 500;
      color: #171717;
    }
    
    main { padding: 0; }
    
    .loading {
      text-align: center;
      padding: 4rem;
      color: #737373;
    }
    
    .spinner {
      display: inline-block;
      width: 32px;
      height: 32px;
      border: 3px solid #e5e5e5;
      border-top: 3px solid #0969da;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    
    button {
      padding: 0.5rem 1rem;
      border: 1px solid #d0d7de;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      background: #f6f8fa;
      color: #24292f;
    }
    
    button:hover {
      background: #f3f4f6;
      border-color: #0969da;
    }
    button:active { transform: scale(0.98); }
    
    .btn-danger {
      background: #cf222e;
      color: white;
      border-color: #cf222e;
    }
    
    .btn-danger:hover {
      background: #a40e26;
      border-color: #a40e26;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .page-group {
      margin-bottom: 1.5rem;
      border: 1px solid #d0d7de;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .page-group h2 {
      background: #f6f8fa;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: #171717;
      border-bottom: 1px solid #d0d7de;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    thead {
      background: #f6f8fa;
    }
    
    th {
      padding: 0.6rem 1rem;
      text-align: left;
      font-weight: 500;
      color: #737373;
      font-size: 0.85rem;
    }
    
    td {
      padding: 0.6rem 1rem;
      border-top: 1px solid #e5e5e5;
      background: #ffffff;
    }
    
    tbody tr:hover {
      background: #f6f8fa;
    }
    
    code {
      background: #f6f8fa;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.85rem;
      color: #cf222e;
      cursor: pointer;
      transition: all 0.15s;
    }
    code:hover {
      background: #0969da;
      color: #ffffff;
    }
    code:active {
      transform: scale(0.95);
    }
    
    .badge {
      display: inline-block;
      padding: 0.2rem 0.4rem;
      background: #0969da;
      color: #ffffff;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-right: 0.3rem;
    }
    
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #737373;
    }
    
    .empty-state .icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { 
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: #171717;
      font-weight: 500;
    }
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: #0969da;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🗑️ 清理未使用的 Key</h1>
      <div class="stats">
        <span>总数: <strong id="totalCount">-</strong></span>
        <span>已选: <strong id="selectedCount">0</strong></span>
      </div>
    </header>
    
    <main id="main">
      <div class="loading">
        <div class="spinner"></div>
        <p>加载未使用的 keys...</p>
      </div>
    </main>
  </div>
  
  <script>
    let unusedKeys = [];
    
    // 复制 Key
    function copyKey(key) {
      navigator.clipboard.writeText(key).then(() => {
        // 临时提示
        const toast = document.createElement('div');
        toast.textContent = '✓ 已复制: ' + key;
        toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #2da44e; color: white; padding: 0.75rem 1rem; border-radius: 4px; font-size: 0.9rem; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }).catch(err => {
        alert('复制失败: ' + err.message);
      });
    }
    
    // 加载数据
    async function loadData() {
      try {
        const response = await fetch('/__i18n/cleanup/data');
        const data = await response.json();
        unusedKeys = data.pages;
        renderData(data);
      } catch (error) {
        document.getElementById('main').innerHTML = \`
          <div class="empty-state">
            <div class="icon">❌</div>
            <h3>加载数据失败</h3>
            <p>\${error.message}</p>
          </div>
        \`;
      }
    }
    
    // 渲染数据
    function renderData(data) {
      document.getElementById('totalCount').textContent = data.total;
      
      if (data.total === 0) {
        document.getElementById('main').innerHTML = \`
          <div class="empty-state">
            <div class="icon">✨</div>
            <h3>所有 Key 都在使用中！</h3>
            <p>未发现未使用的 key，你的 i18n 文件很干净。</p>
          </div>
        \`;
        return;
      }
      
      let html = \`
        <div class="actions">
          <button class="btn-secondary" onclick="selectAll()">全选</button>
          <button class="btn-secondary" onclick="deselectAll()">取消全选</button>
          <button class="btn-danger" onclick="deleteSelected()" id="deleteBtn">删除所选</button>
        </div>
      \`;
      
      data.pages.forEach(page => {
        html += \`
          <section class="page-group">
            <h2>
              📄 \${page.pageName} (\${page.keys.length} keys)
            </h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">
                    <input type="checkbox" onchange="togglePage(this, '\${page.pageName}')" checked>
                  </th>
                  <th>Key</th>
                  <th>语种</th>
                  <th style="width: 80px;">文件数</th>
                </tr>
              </thead>
              <tbody>
        \`;
        
        page.keys.forEach(key => {
          const langs = key.languages.map(l => \`<span class="badge">\${l}</span>\`).join('');
          html += \`
            <tr>
              <td>
                <input type="checkbox" 
                       class="key-checkbox" 
                       data-key="\${key.key}" 
                       data-page="\${page.pageName}"
                       onchange="updateSelectedCount()"
                       checked>
              </td>
              <td><code onclick="copyKey('\${key.key}')" title="点击复制">\${key.key}</code></td>
              <td>\${langs}</td>
              <td>\${key.fileCount}</td>
            </tr>
          \`;
        });
        
        html += \`
              </tbody>
            </table>
          </section>
        \`;
      });
      
      document.getElementById('main').innerHTML = html;
      updateSelectedCount();
    }
    
    // 全选
    function selectAll() {
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
      updateSelectedCount();
    }
    
    // 全不选
    function deselectAll() {
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      updateSelectedCount();
    }
    
    // 切换页面选择
    function togglePage(checkbox, pageName) {
      const checkboxes = document.querySelectorAll(\`.key-checkbox[data-page="\${pageName}"]\`);
      checkboxes.forEach(cb => cb.checked = checkbox.checked);
      updateSelectedCount();
    }
    
    // 更新选中数量
    function updateSelectedCount() {
      const selected = document.querySelectorAll('.key-checkbox:checked').length;
      document.getElementById('selectedCount').textContent = selected;
      document.getElementById('deleteBtn').disabled = selected === 0;
    }
    
    // 删除选中的 keys
    async function deleteSelected() {
      const selected = Array.from(document.querySelectorAll('.key-checkbox:checked'))
        .map(cb => cb.dataset.key);
      
      if (selected.length === 0) {
        alert('请至少选择一个 key');
        return;
      }
      
      if (!confirm(\`从所有语言文件中删除 \${selected.length} 个 keys？\\n\\n此操作无法撤销！\`)) {
        return;
      }
      
      const deleteBtn = document.getElementById('deleteBtn');
      deleteBtn.disabled = true;
      deleteBtn.textContent = '删除中...';
      
      try {
        const response = await fetch('/__i18n/cleanup/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: selected })
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert(\`✅ 删除成功！\\n\\n已删除 Keys: \${result.keysRemoved}\\n已更新文件: \${result.filesUpdated}\`);
          loadData(); // 重新加载
        } else {
          alert('❌ 错误: ' + result.error);
          deleteBtn.disabled = false;
          deleteBtn.textContent = '删除所选';
        }
      } catch (error) {
        alert('❌ 错误: ' + error.message);
        deleteBtn.disabled = false;
        deleteBtn.textContent = '删除所选';
      }
    }
    
    // 初始加载
    loadData();
  </script>
</body>
</html>
  `.trim()
}

/**
 * 获取未使用 key 的数据
 */
export async function getCleanupData(): Promise<any> {
  const cleaner = new KeyCleaner('./src/page')
  const unusedKeys = await cleaner.findUnusedKeys()

  // 按页面分组
  const byPage = new Map<string, UnusedKeyInfo[]>()

  for (const item of unusedKeys) {
    const page = item.page || 'unknown'
    if (!byPage.has(page)) {
      byPage.set(page, [])
    }
    byPage.get(page)!.push(item)
  }

  // 转换为数组
  const pages = Array.from(byPage.entries()).map(([pageName, keys]) => ({
    pageName,
    keys: keys.map((k) => ({
      key: k.key,
      languages: k.languages,
      fileCount: k.definedIn.length,
    })),
  }))

  return {
    total: unusedKeys.length,
    pages,
  }
}

/**
 * 执行删除
 */
export async function executeCleanup(keys: string[]): Promise<any> {
  const cleaner = new KeyCleaner('./src/page')

  try {
    const result = await cleaner.removeKeys(keys)
    return {
      success: true,
      keysRemoved: result.keysRemoved,
      filesUpdated: result.filesUpdated,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 解析 POST body
 */
export function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}
