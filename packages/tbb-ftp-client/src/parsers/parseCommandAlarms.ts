import type { MasterCommandsAlarm } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/commands/alarms`
 *
 * **Example**:
 * ```txt
 * 1 100 0 -1 "" "Tanımsız"
 * ```
 */
export function parseCommandAlarms(content: string) {
  const lines = splitLines(content)
  const commands: MasterCommandsAlarm[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const command: MasterCommandsAlarm = {
      commandNo: tokens.get(0, 'integer'),
      alarmNo: tokens.get(1, 'integer'),
      alarm: tokens.get(5, 'string'),
    }
    commands.push(command)
  }
  return commands
}
