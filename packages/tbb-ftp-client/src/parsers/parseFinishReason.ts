import type { FinishReason } from '../types'

/**
 * **Path**: `/tbb6500/data/config/bitirmenedenleri`
 *
 * **Example**:
 * ```txt
 * 1 "Renk OK" 3 "Bitir"
 * ```
 */
const typeIdMap = {
  3: 'Bitir',
  4: 'Atla',
  5: 'Makine Duraklatma',
}

const pattern = /^(\d+) "([^"]+)" (\d+) "([^"]+)"$/gim

export function parseFinishReason(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const reason: FinishReason = {
      reasonId: match[1],
      text: match[2],
      typeId: Number.parseInt(match[3]),
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}

export function serializeFinishReason(reasons: FinishReason[]): string {
  const regexStrings = reasons.map(reason => `${reason.reasonId} "${reason.text}" ${reason.typeId} "${typeIdMap[reason.typeId]}"`)
  return regexStrings.join('\n')
}
