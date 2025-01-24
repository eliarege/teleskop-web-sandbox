const TRUE_RE = /^(?:y|yes|true|on|1)$/i
const FALSE_RE = /^(?:no?|false|off|0)$/i

/**
 * Infer boolean environment variable
 *
 * @example
 * inferBoolean('on') // returns true
 * inferBoolean('off') // returns false
 * inferBoolean(undefined) // returns false
 *
 * @param value
 * @returns Inferred boolean
 */
export function inferBoolean(value: string | undefined, strict?: true): boolean
export function inferBoolean(value: string | undefined, strict: false): boolean | undefined
export function inferBoolean(value: string | undefined, strict = true): boolean | undefined {
  if (!value)
    return false
  if (TRUE_RE.test(value))
    return true
  if (FALSE_RE.test(value))
    return false
  if (strict)
    throw new TypeError(`Expected boolean value, got ${value}`)
}

export function isDef<T>(value: T): value is Exclude<T, undefined> {
  return typeof value !== 'undefined'
}

export function tryJsonParse(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}
