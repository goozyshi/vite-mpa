/**
 * 新增语种命令
 * 使用方式：npm run lang:add <langCode>
 */

import arg from 'arg'
import ora from 'ora'
import chalk from 'chalk'
import prompts from 'prompts'
import path from 'path'
import { FileUtils } from '../core/utils/file-utils'
import { CSVMatcher } from '../core/matcher/csv-matcher'
import { flattenJSON, unflattenJSON, getAllKeys } from '../core/utils/json-utils'
import { defaultI18nConfig } from '../../../config/i18n.config'

// 解析命令行参数
const args = arg({
  '--csv-dir': String,
  '--dry-run': Boolean,
  '--pages': String,
  '--help': Boolean,
  '-h': '--help',
})

// 显示帮助信息
if (args['--help']) {
  console.log(`
Usage: npm run lang:add <langCode> [options]

Arguments:
  langCode              Language code (e.g., tr, fr, de)

Options:
  --csv-dir <path>      CSV directory (default: ./translations)
  --dry-run            Preview only, do not create files
  --pages <names>       Specific pages (comma separated)
  --help, -h           Show help

Examples:
  npm run lang:add tr
  npm run lang:add fr --dry-run
  npm run lang:add de --pages example,dashboard
`)
  process.exit(0)
}

const langCode = args._[0]
const options = {
  csvDir: args['--csv-dir'] || './translations',
  dryRun: args['--dry-run'] || false,
  pages: args['--pages'] || '',
}

interface PageLangResult {
  page: string
  totalKeys: number
  matched: number
  missing: number
  missingKeys: string[]
  outputFile: string
}

async function main() {
  console.log(chalk.bold.cyan('\n🌍 Adding New Language\n'))

  // 1. 验证语种代码
  if (!langCode || langCode.length < 2) {
    console.error(chalk.red('❌ Invalid language code'))
    process.exit(1)
  }

  console.log(chalk.gray(`Language Code: ${chalk.white(langCode)}`))
  console.log(chalk.gray(`CSV Directory: ${chalk.white(options.csvDir)}`))
  console.log(chalk.gray(`Dry Run: ${chalk.white(options.dryRun ? 'Yes' : 'No')}\n`))

  // 2. 扫描页面
  const spinner = ora('Scanning pages...').start()
  const pages = await scanPages(options.pages)

  if (pages.length === 0) {
    spinner.fail('No pages found')
    process.exit(1)
  }

  spinner.succeed(`Found ${pages.length} pages: ${pages.join(', ')}`)

  // 3. 检查目标语种文件是否已存在
  const existingFiles = await checkExistingLangFiles(pages, langCode)
  if (existingFiles.length > 0) {
    spinner.warn(`Warning: ${existingFiles.length} files already exist`)
    console.log(chalk.yellow('\nExisting files:'))
    existingFiles.forEach((f) => console.log(chalk.gray(`  - ${f}`)))

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Overwrite existing files?',
      initial: false,
    })

    if (!confirm) {
      console.log(chalk.gray('Cancelled'))
      process.exit(0)
    }
  }

  // 4. 初始化 CSV Matcher
  spinner.start('Loading CSV translations...')
  const matcher = new CSVMatcher({
    csvDir: path.resolve(process.cwd(), options.csvDir),
    placeholderRules: defaultI18nConfig.placeholderRules,
  })
  spinner.succeed('CSV translations loaded')

  // 5. 处理每个页面
  const results: PageLangResult[] = []
  const totalSpinner = ora()

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    totalSpinner.start(`[${i + 1}/${pages.length}] Processing page: ${page}`)

    try {
      const result = await processPage(page, langCode, matcher, options.dryRun)
      results.push(result)
      totalSpinner.succeed(
        `[${i + 1}/${pages.length}] ${page}: ${result.matched}/${result.totalKeys} matched`
      )
    } catch (error: any) {
      totalSpinner.fail(`[${i + 1}/${pages.length}] Failed to process ${page}: ${error.message}`)
    }
  }

  // 6. 输出统计报告
  printSummary(results, langCode, options.dryRun)

  // 7. 提示更新配置
  if (!options.dryRun) {
    printConfigUpdateHint(langCode)
  }
}

/**
 * 扫描页面目录
 */
async function scanPages(specificPages: string): Promise<string[]> {
  const srcPath = path.resolve(process.cwd(), 'src/page')

  if (specificPages) {
    // 使用指定的页面
    return specificPages.split(',').map((p) => p.trim())
  }

  // 扫描所有页面目录
  const dirs = await FileUtils.scanDirs('*/', {
    cwd: srcPath,
    onlyDirectories: true,
    deep: 1,
  })

  return dirs.map((dir) => path.basename(dir))
}

/**
 * 检查已存在的语种文件
 */
async function checkExistingLangFiles(pages: string[], langCode: string): Promise<string[]> {
  const existing: string[] = []

  for (const page of pages) {
    const langFile = path.resolve(process.cwd(), `src/page/${page}/i18n/${langCode}.json`)
    if (await FileUtils.exists(langFile)) {
      existing.push(`src/page/${page}/i18n/${langCode}.json`)
    }
  }

  return existing
}

/**
 * 处理单个页面
 */
async function processPage(
  page: string,
  langCode: string,
  matcher: CSVMatcher,
  dryRun: boolean
): Promise<PageLangResult> {
  const pageDir = path.resolve(process.cwd(), `src/page/${page}`)
  const enFile = path.join(pageDir, 'i18n/en.json')
  const targetFile = path.join(pageDir, `i18n/${langCode}.json`)

  // 1. 读取 en.json
  if (!(await FileUtils.exists(enFile))) {
    throw new Error(`en.json not found in ${page}`)
  }

  const enContent = await FileUtils.readJSON(enFile)

  // 2. 获取所有 key 路径（扁平化）
  const keys = getAllKeys(enContent)

  // 3. 从 CSV 匹配新语种翻译
  const matchResult = await matcher.matchNewLang(keys, langCode)

  // 4. 构建目标语种的 JSON（保持与 en.json 相同的结构）
  const targetFlat: Record<string, string> = {}

  // 构建匹配的 key -> translation 映射
  const matchedMap = new Map<string, string>()
  for (const item of matchResult.matchedList) {
    matchedMap.set(item.key, item.translation)
  }

  for (const key of keys) {
    if (matchedMap.has(key)) {
      targetFlat[key] = matchedMap.get(key)!
    } else {
      // 未匹配的 key，使用英文占位
      const flatEn = flattenJSON(enContent)
      targetFlat[key] = flatEn[key] || key
    }
  }

  // 5. 反扁平化，恢复嵌套结构
  const targetContent = unflattenJSON(targetFlat)

  // 6. 写入文件（除非 dry-run）
  if (!dryRun) {
    await FileUtils.ensureDir(path.dirname(targetFile))
    await FileUtils.writeJSON(targetFile, targetContent, 2)
  }

  return {
    page,
    totalKeys: keys.length,
    matched: matchResult.matched,
    missing: matchResult.unmatched,
    missingKeys: matchResult.unmatchedList,
    outputFile: path.relative(process.cwd(), targetFile),
  }
}

/**
 * 输出统计报告
 */
function printSummary(results: PageLangResult[], langCode: string, dryRun: boolean) {
  console.log(chalk.bold.cyan('\n📊 Summary\n'))

  const totalKeys = results.reduce((sum, r) => sum + r.totalKeys, 0)
  const totalMatched = results.reduce((sum, r) => sum + r.matched, 0)
  const totalMissing = results.reduce((sum, r) => sum + r.missing, 0)

  console.log(chalk.gray(`  Total Pages: ${chalk.white(results.length)}`))
  console.log(chalk.gray(`  Total Keys: ${chalk.white(totalKeys)}`))
  console.log(chalk.green(`  ✓ Matched: ${chalk.white(totalMatched)}`))

  if (totalMissing > 0) {
    console.log(chalk.yellow(`  ⚠ Missing: ${chalk.white(totalMissing)}`))
  }

  if (!dryRun) {
    console.log(chalk.green(`  ✓ Files Created: ${chalk.white(results.length)}`))
  }

  // 显示缺失的 keys（每个页面）
  if (totalMissing > 0) {
    console.log(chalk.yellow('\n⚠️  Missing Translations:\n'))

    results.forEach((result) => {
      if (result.missing > 0) {
        console.log(chalk.yellow(`  ${result.page}: ${result.missing} keys`))

        // 显示前 5 个缺失的 keys
        const displayKeys = result.missingKeys.slice(0, 5)
        displayKeys.forEach((key) => {
          console.log(chalk.gray(`    - ${key}`))
        })

        if (result.missingKeys.length > 5) {
          console.log(chalk.gray(`    ... and ${result.missingKeys.length - 5} more`))
        }
      }
    })

    console.log(chalk.cyan('\n💡 Add missing translations to CSV and run again'))
  }

  if (dryRun) {
    console.log(chalk.cyan('\n🔍 Dry-run mode: No files were created'))
  } else {
    console.log(chalk.green('\n✅ Language files created successfully!'))
  }
}

/**
 * 提示更新配置文件
 */
function printConfigUpdateHint(langCode: string) {
  console.log(chalk.bold.cyan('\n📝 Next Steps\n'))
  console.log(chalk.gray('Update src/i18n/config.ts:\n'))

  console.log(chalk.white('1. Add to SUPPORTED_LOCALES:\n'))
  console.log(
    chalk.cyan(`   export const SUPPORTED_LOCALES = ['en', 'zh', 'ar', '${langCode}'] as const\n`)
  )

  console.log(chalk.white('2. Add to LOCALE_CONFIG:\n'))
  console.log(chalk.cyan(`   ${langCode}: {`))
  console.log(chalk.cyan(`     name: 'Language Name',  // e.g., 'Türkçe' for Turkish`))
  console.log(chalk.cyan(`     label: '${langCode.toUpperCase()}',`))
  console.log(chalk.cyan(`     dir: 'ltr'  // or 'rtl' for right-to-left languages`))
  console.log(chalk.cyan(`   }\n`))

  console.log(chalk.gray('3. Test the new language in your app\n'))
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Error:'), error.message)
  process.exit(1)
})
