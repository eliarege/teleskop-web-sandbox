import type { CommandAlarmReason } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/config/commandAlarmReasons`
 *
 * **Example**:
 * ```txt
 * 2 "Sicak Su Vanasi Acilmadi" 2,3,5,6,7 1
 * ```
 */
export function parseCommandAlarmReasons(content: string) {
  const lines = splitLines(content)
  const reasons: CommandAlarmReason[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    reasons.push({
      id: tokens.get(0, 'integer'),
      reasonText: tokens.get(1, 'string'),
      commandNumbers: tokens.get(2, 'integer-list'),
      groupId: tokens.get(3, 'integer'),
    })
  }
  return reasons
}

export function serializeCommandAlarmReasons(reasons: CommandAlarmReason[]): string {
  const regexStrings = reasons.map(reason => `${reason.id} "${reason.reasonText}" ${reason.commandNumbers.join(',')} ${reason.groupId}`)
  return regexStrings.join('\n')
}
