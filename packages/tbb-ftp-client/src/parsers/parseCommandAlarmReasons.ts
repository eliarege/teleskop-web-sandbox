import type { CommandAlarmReason } from '../types'

const pattern = /^(\d+) "([^"]+)" ((?:\d+(?:,\d+)*,)*\d+) (\d+)$/gim
/**
 * **Path**: `/tbb6500/data/config/commandAlarmReasons`
 *
 * **Example**:
 * ```txt
 * 2 "Sicak Su Vanasi Acilmadi" 2,3,5,6,7 1
 * ```
 */
export function parseCommandAlarmReasons(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const commandNumbersArray = match[3].split(',').map(Number)

    const reason: CommandAlarmReason = {
      id: Number.parseInt(match[1]),
      reasonText: match[2],
      commandNumbers: commandNumbersArray,
      groupId: Number.parseInt(match[4]),
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}

export function serializeCommandAlarmReasons(reasons: CommandAlarmReason[]): string {
  const regexStrings = reasons.map(reason => `${reason.id} "${reason.reasonText}" ${reason.commandNumbers.join(',')} ${reason.groupId}`)
  return regexStrings.join('\n')
}
