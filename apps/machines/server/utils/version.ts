import type { Knex } from 'knex'

const VERSION_RE = /^(\d+\.)*\d+$/

export async function fetchDatabaseVersion(db: Knex): Promise<string> {
  const result = await db
    .from('TFDBVERSION')
    .first({ version: 'DBVERSION' })
  if (!result) {
    throw new Error('Database version not found')
  }
  return result.version
}
// Version format: 3.4.10.0

function assertVersionFormat(version: string) {
  if (!VERSION_RE.test(version)) {
    throw new Error(`Invalid version format: ${version}`)
  }
}

export function compareVersions(v1: string, v2: string): number {
  assertVersionFormat(v1)
  assertVersionFormat(v2)
  if (v1 === v2)
    return 0

  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  const len = Math.max(parts1.length, parts2.length)
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0
    if (num1 > num2)
      return 1
    if (num1 < num2)
      return -1
  }
  return 0
}

/**
 * Check if v1 > v2
 */
export function isGreaterVersion(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) > 0
}

/**
 * Check if v1 >= v2
 */
export function isGreaterOrEqualVersion(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) >= 0
}

/**
 * Check if v1 < v2
 */
export function isLessVersion(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) < 0
}

/**
 * Check if v1 <= v2
 */
export function isLessOrEqualVersion(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) <= 0
}

/**
 * Check if v1 === v2
 */
export function isEqualVersion(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) === 0
}
