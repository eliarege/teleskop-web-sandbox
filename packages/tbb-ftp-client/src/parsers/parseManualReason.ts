import type { ManualReason } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/config/manuelmodnedenleri`
 *
 * **Example**:
 * ```txt
 * 2 "Kumaş koptu-sardı"
 * ```
 */
export function parseManualReason(content: string) {
  const lines = splitLines(content)
  const reasons: Partial<ManualReason>[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const reason: Partial<ManualReason> = {
      manualCode: tokens.get(0, 'integer'),
      manualName: tokens.get(1, 'string'),
    }
    reasons.push(reason)
  }
  return reasons
}

export function serializeManualReason(reasons: ManualReason[]): string {
  const lines = reasons.map((reason) => {
    return `${reason.manualCode} "${reason.manualName}"`
  })

  return lines.join('\n')
}
