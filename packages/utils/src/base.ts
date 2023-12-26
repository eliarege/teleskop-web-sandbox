const TRUE_RE = /^(?:y|yes|true|on)$/i
const FALSE_RE = /^(?:no?|false|off)$/i

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
export function inferBoolean(value: string | undefined): boolean {
  if (!value)
    return false
  if (TRUE_RE.test(value))
    return true
  if (FALSE_RE.test(value))
    return false
  throw new TypeError(`Expected boolean value, got ${value}`)
}
