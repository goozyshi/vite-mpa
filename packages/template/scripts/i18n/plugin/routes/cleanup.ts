/**
 * 清理工具的可视化界面
 * 路由：/__i18n/cleanup
 */

import type { IncomingMessage, ServerResponse } from 'http'
import { KeyCleaner, UnusedKeyInfo } from '../../core/cleaner/key-cleaner'
import { checkAndPromptGitStatus } from '../../core/utils/git-utils'

/**
 * 渲染清理工具界面
 */
export async function renderCleanupPage(port: number): Promise<string> {
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
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    h1 { font-size: 2rem; font-weight: 700; }
    
    .stats {
      display: flex;
      gap: 2rem;
      font-size: 1rem;
    }
    
    .stats span {
      background: rgba(255,255,255,0.2);
      padding: 0.5rem 1rem;
      border-radius: 8px;
    }
    
    .stats strong { font-weight: 700; }
    
    main { padding: 2rem; }
    
    .loading {
      text-align: center;
      padding: 4rem;
      color: #666;
    }
    
    .spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
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
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    button:active { transform: translateY(0); }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    
    .btn-danger {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .page-group {
      margin-bottom: 2rem;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .page-group h2 {
      background: #f9fafb;
      padding: 1rem 1.5rem;
      font-size: 1.25rem;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    thead {
      background: #f9fafb;
    }
    
    th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #6b7280;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    td {
      padding: 0.75rem 1rem;
      border-top: 1px solid #f3f4f6;
    }
    
    tbody tr:hover {
      background: #f9fafb;
    }
    
    code {
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
      color: #be185d;
    }
    
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.25rem;
    }
    
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }
    
    .empty-state .icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #374151; }
    
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🗑️ Unused Key Cleanup</h1>
      <div class="stats">
        <span>Total: <strong id="totalCount">-</strong></span>
        <span>Selected: <strong id="selectedCount">0</strong></span>
      </div>
    </header>
    
    <main id="main">
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading unused keys...</p>
      </div>
    </main>
  </div>
  
  <script>
    let unusedKeys = [];
    
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
            <h3>Failed to Load Data</h3>
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
            <h3>All Keys Are In Use!</h3>
            <p>No unused keys found. Your i18n files are clean.</p>
          </div>
        \`;
        return;
      }
      
      let html = \`
        <div class="actions">
          <button class="btn-secondary" onclick="selectAll()">Select All</button>
          <button class="btn-secondary" onclick="deselectAll()">Deselect All</button>
          <button class="btn-danger" onclick="deleteSelected()" id="deleteBtn">Delete Selected</button>
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
                  <th>Languages</th>
                  <th style="width: 80px;">Files</th>
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
              <td><code>\${key.key}</code></td>
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
        alert('Please select at least one key to delete');
        return;
      }
      
      if (!confirm(\`Delete \${selected.length} keys from all language files?\\n\\nThis cannot be undone!\`)) {
        return;
      }
      
      const deleteBtn = document.getElementById('deleteBtn');
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
      
      try {
        const response = await fetch('/__i18n/cleanup/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: selected })
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert(\`✅ Success!\\n\\nKeys removed: \${result.keysRemoved}\\nFiles updated: \${result.filesUpdated}\`);
          loadData(); // 重新加载
        } else {
          alert('❌ Error: ' + result.error);
          deleteBtn.disabled = false;
          deleteBtn.textContent = 'Delete Selected';
        }
      } catch (error) {
        alert('❌ Error: ' + error.message);
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete Selected';
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
