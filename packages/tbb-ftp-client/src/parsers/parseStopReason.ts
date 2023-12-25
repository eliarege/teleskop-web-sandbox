import type { StopReason } from '../types'

const pattern = /^(\d+) "([^"]+)"$/gim

/**
 * **Path**: `/tbb6500/data/config/durusnedenleri`
 */
export function parseStopReason(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const reason: StopReason = {
      stopCode: Number.parseInt(match[1]),
      stopName: match[2],
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
