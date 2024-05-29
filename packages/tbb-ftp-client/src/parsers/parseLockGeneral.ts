import type { LockGeneral } from '../types'

const pattern = /^(\d+) "([^"]+)" (\d+) (\d+) (\d+) (\d+) "([^"]+)" "([^"]+)" (\d+) "([^"]*)" (\d+)$/gim

/**
 * **Path**: `/tbb6500/data/locks/locks_general`
 *
 * **Example**:
 * ```txt
 * 0 "Otomatik" 0 0 0 0 "0" "0" 0 "" 1
 * ```
 */
export function parseLockGeneral(content: string) {
  const locks = []
  let match = pattern.exec(content)
  while (match !== null) {
    const lock: Partial<LockGeneral> = {
      lockNo: Number.parseInt(match[1]),
      lockName: match[2],
      logicType: Number.parseInt(match[3]),
      stopDyeing: Number.parseInt(match[4]),
      jumpStep: Number.parseInt(match[5]),
      alarm: Number.parseInt(match[6]),
      onDelay: match[7],
      stepDelay: match[8],
      giveMessage: Number.parseInt(match[9]),
      messageString: match[10],
      active: Number.parseInt(match[11]),
    }
    locks.push(lock)
    match = pattern.exec(content)
  }
  return locks
}
