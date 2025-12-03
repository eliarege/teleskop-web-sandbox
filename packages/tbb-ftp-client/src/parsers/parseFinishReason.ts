import type { FinishReason } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

const typeIdMap = {
  3: 'Bitir',
  4: 'Atla',
  5: 'Makine Duraklatma',
} as Record<number, string>

/**
 * **Path**: `/tbb6500/data/config/bitirmenedenleri`
 *
 * **Example**:
 * ```txt
 * 1 "Renk OK" 3 "Bitir"
 * ```
 */
export function parseFinishReason(content: string) {
  const lines = splitLines(content)
  const reasons: Partial<FinishReason>[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const reason: Partial<FinishReason> = {
      reasonId: tokens.get(0, 'string'),
      text: tokens.get(1, 'string'),
      typeId: tokens.get(2, 'integer'),
    }
    reasons.push(reason)
  }
  return reasons
}

export function serializeFinishReason(reasons: FinishReason[]): string {
  const regexStrings = reasons.map(reason => `${reason.reasonId} "${reason.text}" ${reason.typeId} "${typeIdMap[reason.typeId]}"`)
  return regexStrings.join('\n')
}
