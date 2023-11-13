import type { CommandAlarmReason, FinishReason } from '~/types'

const pattern = /^(\d+) "([^"]+)" (?:\d+(?:,\d+)*) (\d+)$/gim
// '../../tbb6500/data/config/commandAlarmReasons'
export function fileCommandAlarmReasonsParser(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const reason: CommandAlarmReason = {
      id: match[1],
      reasonText: match[2],
      commandNumbers: match[3],
      groupId: match[4],
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
