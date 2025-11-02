interface PageEntry {
  name: string
  path: string
  module: string
  fullPath: string
}

const pages: PageEntry[] = (window as any).__VITE_PAGES__ || []

interface LetterGroup {
  letter: string
  pages: PageEntry[]
}

/**
 * 按首字母分组页面
 */
function groupByFirstLetter(pages: PageEntry[]): LetterGroup[] {
  const grouped: Record<string, PageEntry[]> = {}

  pages.forEach((page) => {
    let firstChar = page.name.charAt(0).toUpperCase()

    // 数字归类为 '#'
    if (/[0-9]/.test(firstChar)) {
      firstChar = '#'
    }
    // 非字母数字归类为 '~'
    else if (!/[A-Z]/.test(firstChar)) {
      firstChar = '~'
    }

    if (!grouped[firstChar]) {
      grouped[firstChar] = []
    }
    grouped[firstChar].push(page)
  })

  // 排序：# 在前，A-Z，~ 在后
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '#') return -1
    if (b === '#') return 1
    if (a === '~') return 1
    if (b === '~') return -1
    return a.localeCompare(b)
  })

  return sortedKeys.map((letter) => ({
    letter,
    pages: grouped[letter].sort((a, b) => a.name.localeCompare(b.name)),
  }))
}

function render() {
  const letterGroups = groupByFirstLetter(pages)
  const pageCount = pages.length

  const html = `
    <div class="header">
      <h1>📱 Vite MPA Development Dashboard</h1>
      <p>快速访问所有页面</p>
      <div class="stats">
        <div class="stat-item">${letterGroups.length} Groups</div>
        <div class="stat-item">${pageCount} Pages</div>
      </div>
    </div>

    ${
      pageCount > 0
        ? `
      <div class="letter-grid">
        ${letterGroups
          .map(
            ({ letter, pages }) => `
          <div class="letter-group">
            <div class="letter-header">
              <div class="letter-badge">${letter}</div>
              <span class="letter-count">${pages.length} page${pages.length > 1 ? 's' : ''}</span>
            </div>
            <div class="page-list">
              ${pages
                .map(
                  (page) => `
                <a href="${page.path}" class="page-link">• ${page.name}</a>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `
        : `
      <div class="empty">
        <div class="empty-icon">📦</div>
        <div>暂无页面</div>
        <div style="margin-top: 8px; font-size: 14px;">
          在 <code>src/page/</code> 中创建你的第一个页面
        </div>
      </div>
    `
    }
  `

  const app = document.getElementById('app')
  if (app) {
    app.innerHTML = html
  }
}

render()
