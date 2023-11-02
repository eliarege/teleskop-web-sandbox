import type { FinishReason } from '~/types'

export function fileFinishReasonParser(content: string) {
  const pattern = /^(\d+) "([^"]+)" (\d+) "([^"]+)"$/gim

  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const reason: FinishReason = {
      reasonId: match[1],
      text: match[2],
      typeId: match[3],
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
