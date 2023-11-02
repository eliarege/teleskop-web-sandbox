import type { ManualReason } from '~/types'

export function fileManualReasonParser(content: string) {
  const pattern = /^(\d+) "([^"]+)"$/gim

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
