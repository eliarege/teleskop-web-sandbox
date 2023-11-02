import type { MachineStopReason } from '~/types'

export function fileStopReasonParser(content: string) {
  const pattern = /^(\d+) "([^"]+)"$/gim

  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const reason: MachineStopReason = {
      stopCode: match[1],
      stopName: match[2],
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
