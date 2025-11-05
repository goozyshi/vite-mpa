/**
 * 占位符规则
 */
export interface PlaceholderRule {
  pattern: RegExp | string
  replacer: string | ((match: string, ...args: any[]) => string)
  description?: string
}

/**
 * 占位符处理器
 */
export class PlaceholderProcessor {
  private rules: PlaceholderRule[]

  constructor(rules: PlaceholderRule[]) {
    this.rules = rules
  }

  /**
   * 处理占位符
   */
  process(text: string): {
    text: string
    warnings: string[]
    hasNamedPlaceholder: boolean
  } {
    if (!text) {
      return { text: '', warnings: [], hasNamedPlaceholder: false }
    }

    let processedText = text
    const warnings: string[] = []

    // 应用所有规则
    for (const rule of this.rules) {
      const pattern =
        typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'g') : rule.pattern

      if (typeof rule.replacer === 'string') {
        processedText = processedText.replace(pattern, rule.replacer)
      } else {
        processedText = processedText.replace(pattern, rule.replacer)
      }
    }

    // 检测命名占位符
    const namedPlaceholders = this.detectNamedPlaceholders(processedText)

    if (namedPlaceholders.length > 0) {
      warnings.push(`🔸 包含命名占位符: ${namedPlaceholders.join(', ')} - 需人工确认是否正确`)
    }

    return {
      text: processedText,
      warnings,
      hasNamedPlaceholder: namedPlaceholders.length > 0,
    }
  }

  /**
   * 检测命名占位符 {crystal}, {breakDay} 等
   */
  detectNamedPlaceholders(text: string): string[] {
    const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
    const named: string[] = []
    let match

    while ((match = regex.exec(text)) !== null) {
      const name = match[1]
      // 排除数字占位符 {0}, {1}
      if (!/^\d+$/.test(name)) {
        named.push(`{${name}}`)
      }
    }

    return [...new Set(named)]
  }

  /**
   * 验证占位符一致性
   */
  validate(
    source: string,
    target: string
  ): {
    valid: boolean
    message: string
  } {
    const sourcePlaceholders = this.extractNumericPlaceholders(source)
    const targetPlaceholders = this.extractNumericPlaceholders(target)

    if (sourcePlaceholders.length !== targetPlaceholders.length) {
      return {
        valid: false,
        message: `占位符数量不匹配: 源 ${sourcePlaceholders.length} 个，目标 ${targetPlaceholders.length} 个`,
      }
    }

    return { valid: true, message: '' }
  }

  /**
   * 提取数字占位符
   */
  private extractNumericPlaceholders(text: string): string[] {
    const regex = /\{(\d+)\}/g
    const placeholders: string[] = []
    let match

    while ((match = regex.exec(text)) !== null) {
      placeholders.push(match[0])
    }

    return placeholders
  }
}

/**
 * 默认占位符规则
 */
export const defaultPlaceholderRules: PlaceholderRule[] = [
  {
    pattern: /%([A-Z]{2})/g,
    replacer: (match, letters) => {
      // %AA -> {0}, %BB -> {1}, %CC -> {2}
      const firstChar = letters.charCodeAt(0)
      const index = firstChar - 65 // A=65
      return `{${index}}`
    },
    description: 'CSV 占位符转换: %AA -> {0}',
  },
  {
    pattern: /@/g,
    replacer: "{'@'}",
    description: "特殊字符转义: @ -> {'@'}",
  },
  {
    pattern: /#/g,
    replacer: "{'#'}",
    description: "特殊字符转义: # -> {'#'}",
  },
]
