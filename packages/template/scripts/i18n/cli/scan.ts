import chalk from 'chalk'
import { ZhScanner } from '../core/scanner/zh-scanner'
import { CSVMatcher } from '../core/matcher/csv-matcher'
import { defaultI18nConfig } from '../../../config/i18n.config'

/**
 * 扫描命令 - 测试核心功能
 */
async function scan() {
  console.log(chalk.cyan('\n🔍 扫描 zh_ 占位符...\n'))

  try {
    // 1. 扫描占位符
    const scanner = new ZhScanner({ srcPath: defaultI18nConfig.srcPath })
    const placeholders = await scanner.scan()

    if (placeholders.length === 0) {
      console.log(chalk.green('✅ 未发现 zh_ 占位符\n'))
      return
    }

    console.log(chalk.yellow(`📊 发现 ${placeholders.length} 个 zh_ 占位符`))

    // 按页面分组统计
    const pageStats = placeholders.reduce(
      (acc, item) => {
        acc[item.pageName] = (acc[item.pageName] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    console.log(chalk.cyan('\n按页面统计:'))
    for (const [page, count] of Object.entries(pageStats)) {
      console.log(`   ${page}: ${count} 个`)
    }

    // 2. 尝试匹配 CSV
    console.log(chalk.cyan('\n📦 尝试匹配 CSV 翻译...\n'))

    try {
      const matcher = new CSVMatcher({
        csvDir: defaultI18nConfig.csv.directory,
        placeholderRules: defaultI18nConfig.placeholderRules,
      })

      const matchResult = await matcher.match(placeholders)

      console.log(chalk.cyan('匹配结果:'))
      console.log(`   总数: ${matchResult.stats.total}`)
      console.log(chalk.green(`   ✓ 已匹配: ${matchResult.stats.matchedCount}`))
      console.log(chalk.yellow(`   ✗ 未匹配: ${matchResult.stats.unmatchedCount}`))
      console.log(`   匹配率: ${matchResult.stats.matchRate}%`)

      if (matchResult.stats.namedPlaceholderCount > 0) {
        console.log(
          chalk.yellow(
            `   ⚠️  命名占位符: ${matchResult.stats.namedPlaceholderCount} 个（需人工确认）`
          )
        )
      }

      // 显示部分匹配示例
      if (matchResult.matched.length > 0) {
        console.log(chalk.cyan('\n匹配示例（前3个）:'))
        matchResult.matched.slice(0, 3).forEach((item) => {
          console.log(`   • ${item.zhText} → ${item.key}`)
          if (item.translations.en) {
            console.log(`     en: ${item.translations.en}`)
          }
        })
      }

      // 显示未匹配示例
      if (matchResult.unmatched.length > 0) {
        console.log(chalk.yellow('\n未匹配示例（前3个）:'))
        matchResult.unmatched.slice(0, 3).forEach((item) => {
          console.log(`   • ${item.zhText} (${item.filePath}:${item.line})`)
        })
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(chalk.yellow('⚠️  未找到 translations 目录或 CSV 文件'))
        console.log(chalk.gray('   请在 translations/ 目录下放入 CSV 翻译文件\n'))
      } else {
        throw error
      }
    }

    console.log(chalk.cyan('\n💡 下一步:'))
    console.log(chalk.gray('   1. 将翻译 CSV 文件放入 translations/ 目录'))
    console.log(chalk.gray('   2. 运行 npm run dev 启动开发服务器'))
    console.log(chalk.gray('   3. 访问 http://localhost:5173/__i18n 使用可视化工具\n'))
  } catch (error: any) {
    console.error(chalk.red('\n❌ 执行失败:'), error.message)
    if (error.stack) {
      console.error(chalk.gray(error.stack))
    }
    process.exit(1)
  }
}

scan()

