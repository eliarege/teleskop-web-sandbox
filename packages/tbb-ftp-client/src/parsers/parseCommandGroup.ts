import type { CommandGroup } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/commands/commandGroup`
 *
 * **Example**:
 * ```txt
 * 0 "Komutlar" "grupBoyama.gif"
 * ```
 */
export function parseCommandGroup(content: string) {
  const lines = splitLines(content)
  const groups: CommandGroup[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const group: CommandGroup = {
      commandGroupId: tokens.get(0, 'integer'),
      name: tokens.get(1, 'string'),
      icon: tokens.get(2, 'string').split('.')[0],
    }
    groups.push(group)
  }
  return groups
}
