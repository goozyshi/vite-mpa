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
import {
  ALL_LANGUAGES,
  isLanguageConfigured,
  isLanguageEnabled,
  getCSVColumns,
  getAllConfiguredLanguages,
} from '../../../src/i18n/config'

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
  missingTranslations: Array<{
    key: string
    enValue: string
  }>
  outputFile: string
}

async function main() {
  console.log(chalk.bold.cyan('\n🌍 Adding New Language\n'))

  // 1. 验证语种代码
  if (!langCode || langCode.length < 2) {
    console.error(chalk.red('❌ Invalid language code'))
    process.exit(1)
  }

  // 2. 检查语种是否已配置
  if (!isLanguageConfigured(langCode)) {
    console.error(chalk.red(`❌ Language '${langCode}' is not configured in src/i18n/config.ts`))
    console.log(chalk.yellow('\n💡 Available languages:'))
    getAllConfiguredLanguages().forEach((code) => {
      const lang = ALL_LANGUAGES[code]
      const status = lang.enabled ? chalk.green('enabled') : chalk.gray('not enabled')
      console.log(chalk.gray(`  - ${code}: ${lang.name} (${status})`))
    })
    console.log(chalk.cyan('\n📝 To add a new language, update src/i18n/config.ts'))
    process.exit(1)
  }

  // 3. 检查语种是否已启用
  const langConfig = ALL_LANGUAGES[langCode]
  if (isLanguageEnabled(langCode)) {
    console.warn(chalk.yellow(`⚠️  Language '${langCode}' is already enabled in frontend`))
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Continue anyway?',
      initial: true,
    })
    if (!confirm) {
      console.log(chalk.gray('Cancelled'))
      process.exit(0)
    }
  }

  console.log(chalk.gray(`Language: ${chalk.white(langCode)} (${langConfig.name})`))
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
  const columnMapping = buildColumnMapping(langCode)
  const matcher = new CSVMatcher({
    csvDir: path.resolve(process.cwd(), options.csvDir),
    placeholderRules: defaultI18nConfig.placeholderRules,
    columnMapping,
  })
  spinner.succeed('CSV translations loaded')

  // 5. 处理每个页面
  const results: PageLangResult[] = []
  const totalSpinner = ora()

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    totalSpinner.start(`[${i + 1}/${pages.length}] Processing page: ${page}`)

    try {
      const result = await processPage(page, langCode, matcher, true) // 始终使用 dryRun 模式收集信息
      results.push(result)
      totalSpinner.succeed(
        `[${i + 1}/${pages.length}] ${page}: ${result.matched}/${result.totalKeys} matched`
      )
    } catch (error: any) {
      totalSpinner.fail(`[${i + 1}/${pages.length}] Failed to process ${page}: ${error.message}`)
    }
  }

  // 5.5 检查是否有缺失的翻译
  const allMissingTranslations: Array<{ page: string; key: string; enValue: string }> = []
  for (const result of results) {
    for (const missing of result.missingTranslations) {
      allMissingTranslations.push({
        page: result.page,
        key: missing.key,
        enValue: missing.enValue,
      })
    }
  }

  // 如果有任何缺失，终止执行
  if (allMissingTranslations.length > 0) {
    printMissingTranslationsError(allMissingTranslations, langCode, langConfig.name)
    process.exit(1)
  }

  // 5.6 所有翻译完整，执行实际写入
  if (!options.dryRun) {
    totalSpinner.start('Writing language files...')
    for (const result of results) {
      await writePageLangFile(result.page, langCode, matcher)
    }
    totalSpinner.succeed('All language files created successfully')
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
  const keys = getAllKeys(enContent)

  // 2. 从 CSV 匹配新语种翻译
  const matchResult = await matcher.matchNewLang(keys, langCode)

  // 3. 构建目标语种的 JSON
  const targetFlat: Record<string, string> = {}
  const missingTranslations: Array<{ key: string; enValue: string }> = []

  // 构建匹配的 key -> translation 映射
  const matchedMap = new Map<string, string>()
  for (const item of matchResult.matchedList) {
    matchedMap.set(item.key, item.translation)
  }

  const flatEn = flattenJSON(enContent)

  for (const key of keys) {
    if (matchedMap.has(key)) {
      const translation = matchedMap.get(key)!

      // 检查翻译内容是否为空
      if (!translation || translation.trim() === '') {
        missingTranslations.push({ key, enValue: flatEn[key] || key })
        targetFlat[key] = flatEn[key] || key // 临时使用英文，但不会写入磁盘
      } else {
        targetFlat[key] = translation
      }
    } else {
      // 未匹配到翻译，记录为缺失
      missingTranslations.push({ key, enValue: flatEn[key] || key })
      targetFlat[key] = flatEn[key] || key // 临时使用英文，但不会写入磁盘
    }
  }

  // 4. 反扁平化，恢复嵌套结构
  const targetContent = unflattenJSON(targetFlat)

  // 5. 写入文件（除非 dry-run）
  if (!dryRun) {
    await FileUtils.ensureDir(path.dirname(targetFile))
    await FileUtils.writeJSON(targetFile, targetContent, 2)
  }

  return {
    page,
    totalKeys: keys.length,
    matched: matchResult.matched,
    missing: missingTranslations.length,
    missingKeys: matchResult.unmatchedList,
    missingTranslations,
    outputFile: path.relative(process.cwd(), targetFile),
  }
}

/**
 * 打印缺失翻译错误
 */
function printMissingTranslationsError(
  missingList: Array<{ page: string; key: string; enValue: string }>,
  langCode: string,
  langName: string
) {
  console.log('\n' + chalk.red('❌ 翻译不完整，无法生成语种文件'))
  console.log(chalk.yellow(`\n发现 ${missingList.length} 个缺失的翻译项：\n`))

  // 按页面分组显示
  const byPage = new Map<string, Array<{ key: string; enValue: string }>>()
  for (const item of missingList) {
    if (!byPage.has(item.page)) {
      byPage.set(item.page, [])
    }
    byPage.get(item.page)!.push({ key: item.key, enValue: item.enValue })
  }

  // 打印每个页面的缺失项
  for (const [page, items] of byPage) {
    console.log(chalk.cyan(`  📄 ${page}:`))
    items.slice(0, 5).forEach((item) => {
      console.log(chalk.gray(`    • ${item.key}`))
      console.log(chalk.gray(`      English: "${item.enValue}"`))
    })
    if (items.length > 5) {
      console.log(chalk.gray(`    ... 还有 ${items.length - 5} 个缺失项`))
    }
    console.log()
  }

  // 提供修复指导
  console.log(chalk.yellow('📝 修复步骤：'))
  console.log(chalk.gray('  1. 导出当前翻译到 CSV:'))
  console.log(chalk.cyan(`     pnpm lang:export`))
  console.log(chalk.gray(`  2. 在 CSV 中补全 ${langName}(${langCode}) 列的翻译内容`))
  console.log(chalk.gray('  3. 重新执行新增语种命令:'))
  console.log(chalk.cyan(`     pnpm lang:add ${langCode}`))
  console.log()
}

/**
 * 写入页面语种文件
 */
async function writePageLangFile(page: string, langCode: string, matcher: CSVMatcher): Promise<void> {
  const pageDir = path.resolve(process.cwd(), `src/page/${page}`)
  const enFile = path.join(pageDir, 'i18n/en.json')
  const targetFile = path.join(pageDir, `i18n/${langCode}.json`)

  // 1. 读取 en.json
  const enContent = await FileUtils.readJSON(enFile)
  const keys = getAllKeys(enContent)

  // 2. 从 CSV 匹配新语种翻译
  const matchResult = await matcher.matchNewLang(keys, langCode)

  // 3. 构建目标语种的 JSON（此时已确保没有缺失）
  const targetFlat: Record<string, string> = {}
  const matchedMap = new Map<string, string>()
  for (const item of matchResult.matchedList) {
    matchedMap.set(item.key, item.translation)
  }

  for (const key of keys) {
    targetFlat[key] = matchedMap.get(key)!
  }

  // 4. 反扁平化，恢复嵌套结构
  const targetContent = unflattenJSON(targetFlat)

  // 5. 写入文件
  await FileUtils.ensureDir(path.dirname(targetFile))
  await FileUtils.writeJSON(targetFile, targetContent, 2)
}

/**
 * 输出统计报告
 */
function printSummary(results: PageLangResult[], langCode: string, dryRun: boolean) {
  console.log(chalk.bold.cyan('\n📊 Summary\n'))

  const totalKeys = results.reduce((sum, r) => sum + r.totalKeys, 0)
  const totalMatched = results.reduce((sum, r) => sum + r.matched, 0)

  const langName = ALL_LANGUAGES[langCode]?.name || langCode

  console.log(chalk.gray(`  Language: ${chalk.white(langCode)} (${langName})`))
  console.log(chalk.gray(`  Total Pages: ${chalk.white(results.length)}`))
  console.log(chalk.gray(`  Total Keys: ${chalk.white(totalKeys)}`))
  console.log(chalk.green(`  ✓ Matched: ${chalk.white(totalMatched)} (100%)`))

  if (!dryRun) {
    console.log(chalk.green(`  ✓ Files Created: ${chalk.white(results.length)}`))
  }

  if (dryRun) {
    console.log(chalk.cyan('\n🔍 Dry-run mode: No files were created'))
  } else {
    console.log(chalk.green('\n✅ All translations matched successfully!'))
  }
}

/**
 * 提示更新配置文件
 */
function printConfigUpdateHint(langCode: string) {
  if (isLanguageEnabled(langCode)) {
    console.log(chalk.green(`\n✅ Language '${langCode}' is already enabled in frontend`))
    return
  }

  console.log(chalk.bold.cyan('\n📝 Enable Language in Frontend\n'))
  console.log(chalk.gray('Update src/i18n/config.ts:\n'))

  console.log(chalk.white(`Find the '${langCode}' entry in ALL_LANGUAGES and change:\n`))
  console.log(chalk.cyan(`  ${langCode}: {`))
  console.log(chalk.cyan(`    code: '${langCode}',`))
  console.log(chalk.cyan(`    name: '${ALL_LANGUAGES[langCode]?.name || 'Language Name'}',`))
  console.log(chalk.cyan(`    ...`))
  console.log(chalk.green(`    enabled: true,  // ← Change this from false to true`))
  console.log(chalk.cyan(`  }\n`))

  console.log(chalk.gray('After enabling, the language will automatically appear in:'))
  console.log(chalk.gray('  - SUPPORTED_LOCALES'))
  console.log(chalk.gray('  - LOCALE_CONFIG'))
  console.log(chalk.gray('  - DevToolsPanel language selector\n'))
}

/**
 * 动态构建 CSV 列映射
 */
function buildColumnMapping(targetLang: string): Record<string, string[]> {
  const mapping: Record<string, string[]> = {
    key: ['key', 'Key', '键'],
  }

  // 添加目标语种的映射
  const csvColumns = getCSVColumns(targetLang)
  if (csvColumns.length > 0) {
    mapping[targetLang] = csvColumns
  } else {
    // 如果没有配置，使用语种代码作为默认值
    mapping[targetLang] = [targetLang, targetLang.toUpperCase()]
    console.warn(
      chalk.yellow(
        `⚠️  No CSV columns configured for '${targetLang}', using default: [${mapping[targetLang].join(', ')}]`
      )
    )
  }

  return mapping
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Error:'), error.message)
  process.exit(1)
})
