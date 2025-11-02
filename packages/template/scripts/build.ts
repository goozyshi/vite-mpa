import { build } from 'vite'
import chalk from 'chalk'
import ora from 'ora'
import { resolve } from 'path'
import { scanPages } from './utils/pages-scanner'
import { shouldBuildPage } from '../config/pages'
import { createBuildConfig } from '../config/vite.build'

async function buildAll() {
  console.log(chalk.green('📦 Vite MPA 构建'))
  console.log()

  // 1. 扫描所有页面
  const allPages = await scanPages()
  console.log(chalk.blue(`扫描到 ${allPages.length} 个页面`))

  // 2. 过滤需要构建的页面
  const pagesToBuild = allPages.filter((page) => shouldBuildPage(page.name))

  if (pagesToBuild.length === 0) {
    console.log()
    console.log(chalk.yellow('⚠️  没有匹配的页面需要构建'))
    console.log()
    console.log(chalk.gray('提示：'))
    console.log(chalk.gray('  1. 检查 config/pages.ts 配置'))
    console.log(chalk.gray('  2. 空数组表示不构建任何页面'))
    console.log(chalk.gray('  3. 使用 [/.*/] 构建所有页面'))
    console.log(chalk.gray('  4. 使用 [/^example$/] 构建指定页面'))
    console.log()
    process.exit(0)
  }

  console.log(chalk.blue(`匹配到 ${pagesToBuild.length} 个页面需要构建:`))
  pagesToBuild.forEach((page) => {
    console.log(chalk.gray(`  - ${page.name}`))
  })
  console.log()

  // 3. 顺序构建每个页面（避免并发冲突）
  const buildResults: Array<{ name: string; success: boolean; error?: any }> = []

  for (let i = 0; i < pagesToBuild.length; i++) {
    const page = pagesToBuild[i]
    const spinner = ora(
      `[${i + 1}/${pagesToBuild.length}] 构建 ${chalk.cyan(page.name)}...`
    ).start()

    try {
      // 获取页面目录（移除 /index.html）
      const pageDir = resolve(process.cwd(), page.fullPath.replace('/index.html', ''))

      // 创建独立的构建配置
      const config = createBuildConfig(page.name, pageDir)

      // 执行构建（独立实例）
      await build(config)

      spinner.succeed(chalk.green(`✓ ${page.name} 构建成功`))
      console.log(chalk.gray(`  输出: dist/${page.name}/`))
      console.log()

      buildResults.push({ name: page.name, success: true })
    } catch (error) {
      spinner.fail(chalk.red(`✗ ${page.name} 构建失败`))
      console.error(chalk.red('  错误信息:'), error)
      console.log()

      buildResults.push({ name: page.name, success: false, error })

      // 构建失败时继续下一个页面，而不是中断
      // 如果需要中断，取消注释以下行：
      // process.exit(1)
    }
  }

  // 4. 输出构建总结
  console.log()
  console.log(chalk.green('━'.repeat(50)))
  console.log(chalk.green('✨ 构建完成！'))
  console.log()

  const successCount = buildResults.filter((r) => r.success).length
  const failCount = buildResults.filter((r) => !r.success).length

  console.log(chalk.blue('构建统计:'))
  console.log(chalk.green(`  ✓ 成功: ${successCount}`))
  if (failCount > 0) {
    console.log(chalk.red(`  ✗ 失败: ${failCount}`))
  }
  console.log()

  if (successCount > 0) {
    console.log(chalk.blue('构建产物:'))
    buildResults
      .filter((r) => r.success)
      .forEach((r) => {
        console.log(chalk.gray(`  dist/${r.name}/index.html`))
      })
    console.log()
  }

  if (failCount > 0) {
    console.log(chalk.red('失败页面:'))
    buildResults
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(chalk.red(`  ✗ ${r.name}`))
      })
    console.log()
    process.exit(1)
  }
}

buildAll().catch((error) => {
  console.error(chalk.red('构建脚本执行失败:'), error)
  process.exit(1)
})
