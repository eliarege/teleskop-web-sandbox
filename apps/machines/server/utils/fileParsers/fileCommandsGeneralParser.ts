import type { MasterCommand } from '~/types'

const pattern = /^(\d+) (\d+) "([^"]+)" "([^"]+)" "([^"]+)" (\d+) (\d+) (-\d+) (\d+) (\d+) *(-?\d+)?$/gim
/**
 *  '/tbb6500/data/commands/general'
 * example: 1 1 "AK Doldur Cm" "f2" "bobin_AK_Boya_Suyu_Al.gif" 0 1 -1 2 0 -1
 */
export function fileCommandsGeneralParser(content: string) {
  const groups = []
  let match = pattern.exec(content)
  while (match !== null) {
    const group: MasterCommand = {
      commandNo: Number.parseInt(match[1]),
      activated: Number.parseInt(match[2]),
      name: match[3],
      tbbFunctionName: match[4],
      icon: match[5],
      commandType: Number.parseInt(match[6]),
      isRunManual: Number.parseInt(match[7]),
      moveParallel: Number.parseInt(match[9]),
      groupId: Number.parseInt(match[10]),
      // machineConstantId: Number.parseInt(match[11]),
    }
    groups.push(group)
    match = pattern.exec(content)
  }
  return groups
}
