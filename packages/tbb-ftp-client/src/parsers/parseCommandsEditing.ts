import type { MasterCommand } from '../types'

// /^(\d+)((.*) (.*))?$/gim
/**
 * **Path**: `/tbb6500/data/commands/editing`
 *
 * **Example**:
 * ```txt
 * 1  16,30,31,38,42, 1,1,1,1,1,
 * 15  16 1
 * 27  58,56,38,36,57,25,21,19 1,1,1,1,1,1,1,1
 * ```
 */
export function parseCommandsEditing(content: string) {
  const commands: Partial<MasterCommand>[] = []

  const lines = content.split('\n')
  for (const line of lines) {
    if (line) {
      const segments = line.split(' ')
      commands.push({
        commandNo: Number.parseInt(segments[0]),
        adviceList: segments[1] ? segments[1].replace(/,$/, '') : '-1',
        dontUseList: segments[2] ? segments[2].replace(/,$/, '') : null,
        dontUseListCounter: segments[3] ? segments[3].replace(/,$/, '') : null,
      })
    }
  }

  return commands
}
