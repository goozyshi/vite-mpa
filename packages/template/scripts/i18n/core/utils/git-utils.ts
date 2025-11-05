/**
 * Git 工具集
 * 用于检查 git 状态，确保安全操作
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'

const execAsync = promisify(exec)

/**
 * 检查是否在 git 仓库中
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir', { cwd: process.cwd() })
    return true
  } catch {
    return false
  }
}

/**
 * 检查工作区是否干净（没有未提交的更改）
 */
export async function isWorkingTreeClean(): Promise<boolean> {
  try {
    const { stdout: diffStdout } = await execAsync('git diff --quiet', {
      cwd: process.cwd(),
    })
    const { stdout: cachedStdout } = await execAsync('git diff --cached --quiet', {
      cwd: process.cwd(),
    })
    return true
  } catch {
    // 如果有差异，git diff --quiet 会返回非零退出码
    return false
  }
}

/**
 * 获取未提交的文件列表
 */
export async function getUncommittedFiles(): Promise<string[]> {
  try {
    // 获取已修改但未暂存的文件
    const { stdout: unstaged } = await execAsync('git diff --name-only', {
      cwd: process.cwd(),
    })

    // 获取已暂存的文件
    const { stdout: staged } = await execAsync('git diff --cached --name-only', {
      cwd: process.cwd(),
    })

    // 获取未跟踪的文件
    const { stdout: untracked } = await execAsync('git ls-files --others --exclude-standard', {
      cwd: process.cwd(),
    })

    const files = new Set<string>()

    // 合并所有文件
    ;[unstaged, staged, untracked].forEach((output) => {
      output
        .split('\n')
        .filter((f) => f.trim())
        .forEach((f) => files.add(f.trim()))
    })

    return Array.from(files).sort()
  } catch (error) {
    return []
  }
}

/**
 * 获取文件的状态标记
 */
export async function getFileStatus(): Promise<Record<string, string>> {
  try {
    const { stdout } = await execAsync('git status --porcelain', {
      cwd: process.cwd(),
    })

    const statusMap: Record<string, string> = {}

    stdout
      .split('\n')
      .filter((line) => line.trim())
      .forEach((line) => {
        const status = line.substring(0, 2)
        const file = line.substring(3)
        statusMap[file] = status
      })

    return statusMap
  } catch {
    return {}
  }
}

/**
 * 格式化 git 状态提示信息
 */
export function formatGitWarning(files: string[]): string {
  const lines: string[] = []

  lines.push(chalk.yellow('\n⚠️  You have uncommitted changes:\n'))

  // 限制显示文件数量
  const displayFiles = files.slice(0, 10)
  displayFiles.forEach((file) => {
    lines.push(chalk.gray(`  ${file}`))
  })

  if (files.length > 10) {
    lines.push(chalk.gray(`  ... and ${files.length - 10} more files`))
  }

  lines.push(chalk.cyan('\n💡 Please commit or stash your changes first:\n'))
  lines.push(chalk.white('  git add . && git commit -m "chore: save work"'))
  lines.push(chalk.white('  or: git stash\n'))

  return lines.join('\n')
}

/**
 * 格式化 git 安全提示
 */
export function formatGitSafetyMessage(): string {
  const lines: string[] = []

  lines.push(chalk.green('✓ Working tree is clean\n'))
  lines.push(chalk.gray('  All changes are committed or stashed.'))
  lines.push(chalk.gray('  Safe to proceed with file modifications.\n'))

  return lines.join('\n')
}

/**
 * 检查并提示 git 状态
 * @returns true 表示可以继续，false 表示需要中止
 */
export async function checkAndPromptGitStatus(force: boolean = false): Promise<boolean> {
  // 如果强制模式，跳过检查
  if (force) {
    console.log(chalk.yellow('⚠️  Skipping git check (--force mode)'))
    return true
  }

  // 检查是否在 git 仓库中
  const inRepo = await isGitRepo()
  if (!inRepo) {
    console.log(chalk.yellow('⚠️  Not in a git repository, skipping git check'))
    return true
  }

  // 检查工作区是否干净
  const isClean = await isWorkingTreeClean()
  if (!isClean) {
    const files = await getUncommittedFiles()
    console.log(formatGitWarning(files))
    return false
  }

  console.log(formatGitSafetyMessage())
  return true
}
