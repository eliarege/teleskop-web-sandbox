import type { LockGeneral } from '~/types'

/**
 *   '/tbb6500/data/locks/locks_general'
 * example: 0 "Otomatik" 0 0 0 0 "0" "0" 0 "" 1
 */
const pattern = /^(\d+) "([^"]+)" (\d+) (\d+) (\d+) (\d+) "([^"]+)" "([^"]+)" (\d+) "([^"]*)" (\d+)$/gim
export function fileLockGeneralParser(content: string) {
  const locks = []
  let match = pattern.exec(content)
  while (match !== null) {
    const lock: LockGeneral = {
      machineId: Number.parseInt(match[1]),
      lockName: match[2],
      lockNo: Number.parseInt(match[3]),
      logicType: Number.parseInt(match[4]),
      stopDyeing: Number.parseInt(match[5]),
      jumpStep: Number.parseInt(match[6]),
      alarm: Number.parseInt(match[7]),
      onDelay: match[8],
      stepDelay: match[9],
      messageString: match[10],
      giveMessage: Number.parseInt(match[11]),
      aInLogicType: Number.parseInt(match[12]),
      dInLogicType: Number.parseInt(match[13]),
      commandLogicType: Number.parseInt(match[14]),
      lockLogicType: Number.parseInt(match[15]),
      dOutLogicType: Number.parseInt(match[16]),
      vInLogicType: Number.parseInt(match[17]),
    }
    locks.push(lock)
    match = pattern.exec(content)
  }
  return locks
}
