import type { ManualReason } from '../types'

const pattern = /^(\d+) "([^"]+)"$/gim

/**
 * **Path**: `/tbb6500/data/config/manuelmodnedenleri`
 *
 * **Example**:
 * ```txt
 * 2 "Kumaş koptu-sardı"
 * ```
 */
export function parseManualReason(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const reason: Partial<ManualReason> = {
      manualCode: Number.parseInt(match[1]),
      manualName: match[2],
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}

export function serializeManualReason(reasons: ManualReason[]): string {
  const lines = reasons.map((reason) => {
    return `${reason.manualCode} "${reason.manualName}"`
  })

  return lines.join('\n')
}
