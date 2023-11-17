const pattern = /^(\d+) (\d+) "([^"]+)" "([^"]+)" "([^"]+)" (\d+) (\d+) (-\d+) (\d+) (\d+) *(-?\d+)?$/gim
/**
 *  '../../tbb6500/data/commands/general'
 * example: 1 1 "AK Doldur Cm" "f2" "bobin_AK_Boya_Suyu_Al.gif" 0 1 -1 2 0 -1
 */
export function fileCommandsGeneralParser(content: string) {
  const groups = []
  let match = pattern.exec(content)
  while (match !== null) {
    const group = {
      commandNo: match[1],
      activated: match[2],
      name: match[3],
      tbbFunctionName: match[4],
      icon: match[5],
      commandType: match[6],
      isRunManual: match[7],
      moveParallel: match[9],
      groupId: match[10],
      machineConstantId: match[11],
    }
    groups.push(group)
    match = pattern.exec(content)
  }
  return groups
}
