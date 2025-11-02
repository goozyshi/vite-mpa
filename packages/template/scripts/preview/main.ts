interface PageEntry {
  name: string
  path: string
  module: string
  fullPath: string
}

const pages: PageEntry[] = (window as any).__VITE_PAGES__ || []

function groupByModule(pages: PageEntry[]) {
  const grouped: Record<string, PageEntry[]> = {}
  pages.forEach((page) => {
    if (!grouped[page.module]) {
      grouped[page.module] = []
    }
    grouped[page.module].push(page)
  })
  return grouped
}

function render() {
  const grouped = groupByModule(pages)
  const moduleCount = Object.keys(grouped).length
  const pageCount = pages.length

  const html = `
    <div class="header">
      <h1>📱 Pages Preview</h1>
      <p>Vite MPA Development Dashboard</p>
      <div class="stats">
        <div class="stat-item">${moduleCount} Modules</div>
        <div class="stat-item">${pageCount} Pages</div>
      </div>
    </div>

    ${
      pageCount > 0
        ? `
      <div class="search-box">
        <input type="text" id="search" placeholder="Search pages..." />
      </div>

      <div id="page-list">
        ${Object.entries(grouped)
          .map(
            ([module, pages]) => `
          <div class="module-group" data-module="${module}">
            <div class="module-title">${module}</div>
            <div class="page-list">
              ${pages
                .map(
                  (page) => `
                <a href="${page.path}" class="page-item" data-name="${page.name}">
                  <div>
                    <div class="page-name">${page.name}</div>
                    <div class="page-path">${page.path}</div>
                  </div>
                  <span class="arrow">→</span>
                </a>
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
        <div>No pages found</div>
        <div style="margin-top: 8px; font-size: 14px;">
          Create your first page in <code>src/page/</code>
        </div>
      </div>
    `
    }
  `

  const app = document.getElementById('app')
  if (app) {
    app.innerHTML = html
    setupSearch()
  }
}

function setupSearch() {
  const searchInput = document.getElementById('search') as HTMLInputElement
  if (!searchInput) return

  searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase()
    const items = document.querySelectorAll('.page-item')

    items.forEach((item) => {
      const name = item.getAttribute('data-name') || ''
      const visible = name.toLowerCase().includes(query)
      ;(item as HTMLElement).style.display = visible ? 'flex' : 'none'
    })

    const modules = document.querySelectorAll('.module-group')
    modules.forEach((module) => {
      const visibleItems = module.querySelectorAll('.page-item[style*="display: flex"]')
      ;(module as HTMLElement).style.display = visibleItems.length > 0 ? 'block' : 'none'
    })
  })
}

render()
