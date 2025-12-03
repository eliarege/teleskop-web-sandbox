import type { MasterCommand } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/commands/graphic`
 *
 * **Example**:
 * ```txt
 * 15 2 "Çalisma Süresi" "Sicaklik" "Gradyan" "5" "Bekleme Süresi"
 * ```
 */
export function parseCommandGraphic(content: string) {
  const lines = splitLines(content)
  const groups: Partial<MasterCommand>[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const group: Partial<MasterCommand> = {
      commandNo: tokens.get(0, 'integer'),
      type: tokens.get(1, 'integer'),
      x: tokens.get(2, 'string'),
      y: tokens.get(3, 'string'),
      a: tokens.get(4, 'string'),
      maxA: tokens.get(5, 'string'),
      b: tokens.get(6, 'string'),
    }
    groups.push(group)
  }
  return groups
}
