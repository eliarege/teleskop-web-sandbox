import type { ManualReason } from '~/types'

/**
 *  '../../tbb6500/data/config/manuelmodnedenleri'
 * example: 2 "Kumaş koptu-sardı"
 */
const pattern = /^(\d+) "([^"]+)"$/gim
export function fileManualReasonParser(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const reason: ManualReason = {
      manualId: match[1],
      manualReason: match[2],
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
