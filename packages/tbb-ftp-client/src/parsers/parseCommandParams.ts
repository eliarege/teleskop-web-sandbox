const pattern = /^(\d+) (\d+) "([^"]*)" "([^"]*)" "([^"]*)" (\d+) -?(.+) -?(.+) (.+) (\d+)(?: (.+))?$/gim
/**
 *  '/tbb6500/data/commands/params'
 * example: 8 0 "SP 12" "Mikser Off Delay" "" 3 30 0 600 2
 * 9 0 "SP 13" "Mikser" "" 1 0 0 1 0 ["Calisma","0","Calis","1"] => [{name: "calis", value: 0}, ...] TODO
 * 10 0 "SP 2" "Litre" "IK1 Ust Seviye*IK1 Oran/100" 3 0 0 1000 0
 */
export function parseCommandParams(content: string) {
  const groups = []
  let match = pattern.exec(content)
  while (match !== null) {
    const group = {
      commandNo: match[1],
      name: match[3],
      paramName: match[4],
      paramFormula: match[5],
      binding: match[6],
      defaultValue: match[7],
      minValue: match[8],
      maxValue: match[9],
      graphic: match[10],
      selectionList: match[11] ? JSON.parse(match[11]) : null,
    }
    groups.push(group)
    match = pattern.exec(content)
  }
  return groups
}
