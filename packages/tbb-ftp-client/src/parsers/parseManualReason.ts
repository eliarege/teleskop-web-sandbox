import type { ManualReason } from '../types'

/**
 * **Path**: `/tbb6500/data/config/manuelmodnedenleri`
 *
 * **Example**:
 * ```txt
 * 2 "Kumaş koptu-sardı"
 * ```
 */
const pattern = /^(\d+) "([^"]+)"$/gim
export function parseManualReason(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const reason: ManualReason = {
      manualId: Number.parseInt(match[1]),
      manualString: match[2],
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
