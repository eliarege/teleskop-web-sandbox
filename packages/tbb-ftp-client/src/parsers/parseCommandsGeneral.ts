import type { MasterCommand } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/commands/general`
 *
 * **Example**:
 * ```txt
 * 1 1 "AK Doldur Cm" "f2" "bobin_AK_Boya_Suyu_Al.gif" 0 1 -1 2 0 -1
 * ```
 */
export function parseCommandsGeneral(content: string) {
  const lines = splitLines(content)
  const groups: Partial<MasterCommand>[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const group: Partial<MasterCommand> = {
      commandNo: tokens.get(0, 'integer'),
      activated: tokens.get(1, 'integer'),
      name: tokens.get(2, 'string'),
      tbbFunctionName: tokens.get(3, 'string'),
      icon: tokens.get(4, 'string'),
      commandType: tokens.get(5, 'integer'),
      isRunManual: tokens.get(6, 'integer'),
      moveParallel: tokens.get(8, 'integer'),
      groupId: tokens.get(9, 'integer'),
      machineConstantId: tokens.length > 10 ? tokens.get(10, 'integer') : -1,
    }
    groups.push(group)
  }
  return groups
}
