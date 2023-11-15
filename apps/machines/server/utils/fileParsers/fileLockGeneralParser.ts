import type { LockGeneral } from '~/types'

/**
 *   '../../tbb6500/data/locks/locks_general'
 * example: 0 "Otomatik" 0 0 0 0 "0" "0" 0 "" 1
 */
const pattern = /^(\d+) "([^"]+)" (\d+) (\d+) (\d+) (\d+) "([^"]+)" "([^"]+)" (\d+) "([^"]*)" (\d+)$/gim
export function fileLockGeneralParser(content: string) {
  const locks = []
  let match = pattern.exec(content)
  while (match !== null) {
    const lock: LockGeneral = {
      machineId: match[1],
      lockName: match[2],
      lockNo: match[3],
      logicType: match[4],
      stopDyeing: match[5],
      jumpStep: match[6],
      alarm: match[7],
      onDelay: match[8],
      stepDelay: match[9],
      messageString: match[10],
      giveMessage: match[11],
      aInLogicType: match[12],
      dInLogicType: match[13],
      commandLogicType: match[14],
      lockLogicType: match[15],
      dOutLogicType: match[16],
      vInLogicType: match[17],
    }
    locks.push(lock)
    match = pattern.exec(content)
  }
  return locks
}
