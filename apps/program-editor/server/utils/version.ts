function parseSmart(version: string): number | null {
  const match = version.match(/Smart(\d+)/i)
  return match ? Number(match[1]) : null
}

function parseVersion(version: string): number[] {
  const match = version.match(/^(\d+(?:\.\d+)*)/)
  return match ? match[1].split('.').map(Number) : []
}

function compareVersions(v1: number[], v2: number[]): number {
  const maxLen = Math.max(v1.length, v2.length)
  for (let i = 0; i < maxLen; i++) {
    const diff = (v1[i] ?? 0) - (v2[i] ?? 0)
    if (diff !== 0)
      return diff
  }
  return 0
}

/**
 * Belirtilen versiyonun hedef versiyondan yüksek veya eşit olup olmadığını kontrol eder.
 * @param version - Kontrol edilecek versiyon (örn: '3.22.118-Smart62')
 * @param target - Hedef versiyon bilgileri
 * @param target.standardVersion - Hedef versiyon (örn: '3.22.118')
 * @param target.smartVersion - Hedef Smart versiyon (örn: '3.22.7-Smart62')
 * @returns version >= target ise true, değilse false
 */
export function isVersionAbove(version: string, target: { standardVersion: string, smartVersion: string }): boolean {
  const isSmartVersion = version.includes('Smart')
  const targetVersion = isSmartVersion ? target.smartVersion : target.standardVersion

  const currentVer = parseVersion(version)
  const targetVer = parseVersion(targetVersion)

  if (currentVer.length === 0 || targetVer.length === 0)
    return false

  const versionDiff = compareVersions(currentVer, targetVer)
  if (versionDiff !== 0)
    return versionDiff > 0

  if (!isSmartVersion)
    return true

  const currentSmart = parseSmart(version)
  const targetSmart = parseSmart(targetVersion)

  if (currentSmart !== null && targetSmart !== null)
    return currentSmart >= targetSmart

  return currentSmart !== null
}
