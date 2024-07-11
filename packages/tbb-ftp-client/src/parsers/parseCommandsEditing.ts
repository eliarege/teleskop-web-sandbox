import type { MasterCommand } from '../types'

const pattern = /^(\d+)( (.*) )?((.*) (.*))?$/gim
// /^(\d+)((.*) (.*))?$/gim
/**
 * **Path**: `/tbb6500/data/commands/editing`
 *
 * **Example**:
 * ```txt
 * 1  16,30,31,38,42 1,1,1,1,1
 * 15  16 1
 * 27  58,56,38,36,57,25,21,19 1,1,1,1,1,1,1,1
 * ```
 */
export function parseCommandsEditing(content: string) {
  const commands = []
  let match = pattern.exec(content)
  while (match !== null) {
    const command: Partial<MasterCommand> = {
      commandNo: Number.parseInt(match[1]),
      adviceList: match[3] ? match[3].replace(/,$/, '').trim() : '-1',
      dontUseList: match[5] ? match[5].replace(/,$/, '').trim() : null,
      dontUseListCounter: match[6] ? match[6].replace(/,$/, '').trim() : null,
    }
    commands.push(command)
    match = pattern.exec(content)
  }
  return commands
}
