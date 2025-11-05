/**
 * 清理未使用的翻译 key
 * 使用方式：npm run lang:clean
 */

import arg from 'arg'
import ora from 'ora'
import chalk from 'chalk'
import prompts from 'prompts'
import { KeyCleaner, UnusedKeyInfo } from '../core/cleaner/key-cleaner'
import { checkAndPromptGitStatus } from '../core/utils/git-utils'

// 解析命令行参数
const args = arg({
  '--dry-run': Boolean,
  '--interactive': Boolean,
  '--force': Boolean,
  '--help': Boolean,
  '-h': '--help',
  '-d': '--dry-run',
  '-i': '--interactive',
  '-f': '--force',
})

// 显示帮助信息
if (args['--help']) {
  console.log(`
Usage: npm run lang:clean [options]

Options:
  --dry-run, -d         Preview only, do not delete keys
  --interactive, -i     Interactively select keys to remove
  --force, -f          Skip git status check (not recommended)
  --help, -h           Show help

Examples:
  npm run lang:clean --dry-run
  npm run lang:clean --interactive
  npm run lang:clean
`)
  process.exit(0)
}

const options = {
  dryRun: args['--dry-run'] || false,
  interactive: args['--interactive'] || false,
  force: args['--force'] || false,
}

async function main() {
  console.log(chalk.bold.cyan('\n🗑️  Cleaning Unused Translation Keys\n'))

  // 1. Git 状态检查（除非 --force）
  if (!options.force && !options.dryRun) {
    const canProceed = await checkAndPromptGitStatus(options.force)
    if (!canProceed) {
      process.exit(1)
    }
  }

  // 2. 扫描未使用的 key
  const spinner = ora('Scanning for unused keys...').start()
  const cleaner = new KeyCleaner('./src/page')

  let unusedKeys: UnusedKeyInfo[] = []
  try {
    unusedKeys = await cleaner.findUnusedKeys()
    spinner.succeed(`Found ${chalk.yellow(unusedKeys.length)} unused keys`)
  } catch (error: any) {
    spinner.fail(`Failed to scan: ${error.message}`)
    process.exit(1)
  }

  // 3. 如果没有未使用的 key
  if (unusedKeys.length === 0) {
    console.log(chalk.green('\n✨ All keys are in use! No cleanup needed.\n'))
    return
  }

  // 4. 展示未使用的 key（按页面分组）
  displayUnusedKeys(unusedKeys)

  // 5. 交互式选择（如果启用）
  let keysToRemove = unusedKeys.map((k) => k.key)

  if (options.interactive) {
    const selected = await interactiveSelect(unusedKeys)
    if (selected.length === 0) {
      console.log(chalk.gray('\nNo keys selected'))
      return
    }
    keysToRemove = selected
  }

  // 6. Dry-run 模式
  if (options.dryRun) {
    console.log(chalk.cyan('\n🔍 Dry-run mode - would remove:\n'))
    keysToRemove.forEach((key) => {
      console.log(chalk.gray(`  - ${key}`))
    })
    console.log(chalk.cyan(`\nTotal: ${keysToRemove.length} keys\n`))
    return
  }

  // 7. 最终确认
  const confirm = await prompts({
    type: 'confirm',
    name: 'value',
    message: chalk.red(`Delete ${keysToRemove.length} keys from all language files?`),
    initial: false,
  })

  if (!confirm.value) {
    console.log(chalk.gray('Cancelled'))
    return
  }

  // 8. 执行删除
  spinner.start('Removing unused keys...')

  try {
    const result = await cleaner.removeKeys(keysToRemove)
    spinner.succeed('Keys removed successfully')

    // 9. 输出统计
    printSummary(result)
  } catch (error: any) {
    spinner.fail(`Failed to remove keys: ${error.message}`)
    process.exit(1)
  }
}

/**
 * 展示未使用的 key（按页面分组）
 */
function displayUnusedKeys(unusedKeys: UnusedKeyInfo[]) {
  console.log(chalk.bold.yellow('\n📋 Unused Keys:\n'))

  // 按页面分组
  const byPage = new Map<string, UnusedKeyInfo[]>()

  for (const item of unusedKeys) {
    const page = item.page || 'unknown'
    if (!byPage.has(page)) {
      byPage.set(page, [])
    }
    byPage.get(page)!.push(item)
  }

  // 显示每个页面
  for (const [page, keys] of Array.from(byPage.entries())) {
    console.log(chalk.cyan(`\n  📄 ${page} (${keys.length} keys):`))

    // 显示前 10 个
    const displayKeys = keys.slice(0, 10)
    displayKeys.forEach((item) => {
      const langs = item.languages.join(', ')
      console.log(chalk.gray(`    - ${item.key} ${chalk.dim(`(${langs})`)}`))
    })

    if (keys.length > 10) {
      console.log(chalk.gray(`    ... and ${keys.length - 10} more`))
    }
  }

  console.log('')
}

/**
 * 交互式选择要删除的 key
 */
async function interactiveSelect(unusedKeys: UnusedKeyInfo[]): Promise<string[]> {
  // 按页面分组选择
  const byPage = new Map<string, UnusedKeyInfo[]>()

  for (const item of unusedKeys) {
    const page = item.page || 'unknown'
    if (!byPage.has(page)) {
      byPage.set(page, [])
    }
    byPage.get(page)!.push(item)
  }

  const selectedKeys: string[] = []

  for (const [page, keys] of Array.from(byPage.entries())) {
    console.log(chalk.cyan(`\n📄 Page: ${page}`))

    const choices = keys.map((item) => ({
      title: `${item.key} ${chalk.dim(`(${item.languages.join(', ')})`)}`,
      value: item.key,
      selected: true, // 默认全选
    }))

    const response = await prompts({
      type: 'multiselect',
      name: 'keys',
      message: `Select keys to remove from ${page}`,
      choices,
      hint: '- Space to select. Return to submit',
    })

    if (response.keys) {
      selectedKeys.push(...response.keys)
    }
  }

  return selectedKeys
}

/**
 * 输出删除统计
 */
function printSummary(result: {
  filesUpdated: number
  keysRemoved: number
  affectedFiles: string[]
}) {
  console.log(chalk.bold.green('\n✅ Cleanup Completed\n'))

  console.log(chalk.gray(`  Keys Removed: ${chalk.white(result.keysRemoved)}`))
  console.log(chalk.gray(`  Files Updated: ${chalk.white(result.filesUpdated)}`))

  if (result.affectedFiles.length > 0) {
    console.log(chalk.gray('\n  Affected files:'))
    result.affectedFiles.slice(0, 10).forEach((file) => {
      console.log(chalk.gray(`    - ${file}`))
    })
    if (result.affectedFiles.length > 10) {
      console.log(chalk.gray(`    ... and ${result.affectedFiles.length - 10} more`))
    }
  }

  console.log(chalk.cyan('\n💡 Next steps:'))
  console.log(chalk.gray('  1. Review the changes'))
  console.log(chalk.gray('  2. Test your application'))
  console.log(chalk.gray('  3. Commit the changes:\n'))
  console.log(chalk.white('     git add .'))
  console.log(chalk.white('     git commit -m "chore: remove unused translation keys"\n'))
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Error:'), error.message)
  if (error.stack) {
    console.error(chalk.gray(error.stack))
  }
  process.exit(1)
})
