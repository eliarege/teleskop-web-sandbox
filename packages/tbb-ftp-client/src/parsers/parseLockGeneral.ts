import type { LockGeneral } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/locks/locks_general`
 *
 * **Example**:
 * ```txt
 * 0 "Otomatik" 0 0 0 0 "0" "0" 0 "" 1
 * ```
 */
export function parseLockGeneral(content: string) {
  const lines = splitLines(content)
  const locks: Partial<LockGeneral>[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const lock: Partial<LockGeneral> = {
      lockNo: tokens.get(0, 'integer') + 1,
      lockName: tokens.get(1, 'string'),
      logicType: tokens.get(2, 'integer'),
      stopDyeing: tokens.get(3, 'integer'),
      jumpStep: tokens.get(4, 'integer'),
      alarm: tokens.get(5, 'integer'),
      onDelay: tokens.get(6, 'string'),
      stepDelay: tokens.get(7, 'string'),
      giveMessage: tokens.get(8, 'integer'),
      messageString: tokens.get(9, 'string'),
      active: tokens.get(10, 'integer'),
    }
    locks.push(lock)
  }
  return locks
}
