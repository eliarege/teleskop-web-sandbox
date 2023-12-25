import type { CommandGroup } from '../types'

const pattern = /^(\d+) "([^"]+)" "([^"]+)"$/gim
/**
 * **Path**: `/tbb6500/data/commands/commandGroup`
 *
 * **Example**:
 * ```txt
 * 0 "Komutlar" "grupBoyama.gif"
 * ```
 */
export function parseCommandGroup(content: string) {
  const groups = []
  let match = pattern.exec(content)
  while (match !== null) {
    const group: CommandGroup = {
      commandGroupId: Number.parseInt(match[1]),
      name: match[2],
      icon: match[3].split('.')[0],
    }
    groups.push(group)
    match = pattern.exec(content)
  }
  return groups
}
