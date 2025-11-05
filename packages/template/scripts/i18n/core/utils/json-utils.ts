/**
 * JSON 工具集
 * 用于处理嵌套 JSON 的扁平化和反扁平化
 */

/**
 * 将嵌套 JSON 扁平化为点号分隔的 key
 * @example
 * flattenJSON({ a: { b: "v1" }, c: "v2" })
 * // => { "a.b": "v1", "c": "v2" }
 */
export function flattenJSON(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue
    }

    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // 递归处理嵌套对象
      Object.assign(result, flattenJSON(value, fullKey))
    } else {
      // 叶子节点，保存值
      result[fullKey] = value
    }
  }

  return result
}

/**
 * 将扁平化的 JSON 还原为嵌套结构
 * @example
 * unflattenJSON({ "a.b": "v1", "c": "v2" })
 * // => { a: { b: "v1" }, c: "v2" }
 */
export function unflattenJSON(flat: Record<string, any>): any {
  const result: any = {}

  // 按 key 排序，确保父级先于子级创建
  const sortedKeys = Object.keys(flat).sort()

  for (const fullKey of sortedKeys) {
    const value = flat[fullKey]
    const keys = fullKey.split('.')

    let current = result

    // 遍历路径，逐层创建对象
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const isLast = i === keys.length - 1

      if (isLast) {
        // 最后一层，设置值
        current[key] = value
      } else {
        // 中间层，确保对象存在
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {}
        }
        current = current[key]
      }
    }
  }

  return result
}

/**
 * 获取 JSON 对象的所有 key 路径
 * @example
 * getAllKeys({ a: { b: "v1" }, c: "v2" })
 * // => ["a.b", "c"]
 */
export function getAllKeys(obj: any): string[] {
  const flat = flattenJSON(obj)
  return Object.keys(flat).sort()
}

/**
 * 检查 JSON 中是否存在指定 key
 */
export function hasKey(obj: any, key: string): boolean {
  const keys = key.split('.')
  let current = obj

  for (const k of keys) {
    if (!current || typeof current !== 'object' || !(k in current)) {
      return false
    }
    current = current[k]
  }

  return true
}

/**
 * 从 JSON 中删除指定的 keys
 * @returns 新的 JSON 对象（不修改原对象）
 */
export function removeKeys(obj: any, keysToRemove: string[]): any {
  const flat = flattenJSON(obj)

  // 删除指定的 keys
  for (const key of keysToRemove) {
    delete flat[key]
  }

  // 反扁平化
  return unflattenJSON(flat)
}

/**
 * 合并多个 JSON 对象
 * 后面的对象会覆盖前面的
 */
export function mergeJSON(...objects: any[]): any {
  const result: Record<string, any> = {}

  for (const obj of objects) {
    const flat = flattenJSON(obj)
    Object.assign(result, flat)
  }

  return unflattenJSON(result)
}

/**
 * 比较两个 JSON 对象的差异
 * @returns 差异信息
 */
export interface JSONDiff {
  added: string[] // 新增的 keys
  removed: string[] // 删除的 keys
  modified: string[] // 修改的 keys
  unchanged: string[] // 未变化的 keys
}

export function diffJSON(oldObj: any, newObj: any): JSONDiff {
  const oldFlat = flattenJSON(oldObj)
  const newFlat = flattenJSON(newObj)

  const oldKeys = new Set(Object.keys(oldFlat))
  const newKeys = new Set(Object.keys(newFlat))

  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []
  const unchanged: string[] = []

  // 检查新增和修改
  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      added.push(key)
    } else if (oldFlat[key] !== newFlat[key]) {
      modified.push(key)
    } else {
      unchanged.push(key)
    }
  }

  // 检查删除
  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      removed.push(key)
    }
  }

  return {
    added: added.sort(),
    removed: removed.sort(),
    modified: modified.sort(),
    unchanged: unchanged.sort(),
  }
}
