import type { FinishReason } from '../types'

const pattern = /^(\d+) "([^"]+)" (\d+) "([^"]+)"$/gim
/**
 *  '/tbb6500/data/config/bitirmenedenleri'
 * example: 1 "Renk OK" 3 "Bitir"
 */
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
