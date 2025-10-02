import type { CommandParameter } from '../types'

// 1: Float, 2: Integer, 3: String, 4: List
const pattern = /(-?\d+\.\d+)|(-?\d+)|("[^"]*")|(\[[^\]]*\])/g

/**
 * **Path**: `/tbb6500/data/commands/params`
 *
 * **Example**:
 * ```sh
 * # Eski format, seçim listesiz
 * 1 0 "SP 1" "Süre" "" 3 300 0 7200 2
 * # Eski format seçim listeli
 * 2 0 "SP 2" "Dara" "" 3 0 0 1 0 ["Dara Alma","0","Dara Al","1"]
 * # Yeni format, seçim listesiz, makine sabiti seçimleri yapılmış
 * 3 0 "SP 3" "Süre" "" 3 300 0 7200 2 12 34
 * # Yeni format, seçim listeli, makine sabiti seçimleri yapılmış
 * 1 0 "SP 4" "Dara" "" 3 0 0 1 0 ["Dara Alma","0","Dara Al","1"] 12 44
 * # Yeni format, seçim listeli, makine sabiti seçimleri yapılmamış
 * 2 0 "SP 5" "Artan Azalan" "IK1 Ust Seviye*IK1 Oran/100" 3 1 0 1 0 ["Azalan","0","Artan","1"] -1 -1
 * # Yeni format, seçim listesiz, makine sabiti seçimleri yapılmamış
 * 3 0 "SP 6" "Alarm Toleransı" "" 3 0 0 100 0 -1 -1
 * ```
 */

export function parseCommandParams(content: string) {
  const parameters: CommandParameter[] = []
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    const parts = [] as any[] // number | string | { name: string, value: number }[]
    let match = pattern.exec(line)
    let hasSelectionList = false
    while (match !== null) {
      if (match[1]) {
        parts.push(Number.parseFloat(match[1]))
      } else if (match[2]) {
        parts.push(Number.parseInt(match[2]))
      } else if (match[3]) {
        parts.push(match[3].slice(1, -1))
      } else if (match[4]) {
        parts.push(processSelectionList(JSON.parse(match[4])))
        hasSelectionList = true
      }
      match = pattern.exec(line)
    }
    const parameter: CommandParameter = {
      commandNo: parts[0],
      name: parts[2],
      paramName: parts[3],
      paramFormula: parts[4],
      binding: parts[5],
      defaultValue: parts[6],
      minValue: parts[7],
      maxValue: parts[8],
      graphic: parts[9],
      selectionList: hasSelectionList ? parts[10] : null,
    }
    if (parts.length > 10 + Number(hasSelectionList)) {
      parameter.machineConstantIdMin = parts[10 + Number(hasSelectionList)]
      parameter.machineConstantIdMax = parts[11 + Number(hasSelectionList)]
    }

    parameters.push(parameter)
  }
  return parameters
}

function processSelectionList(list: string[]) {
  const processedList: { name: string, value: number }[] = []
  for (let i = 0; i < list.length; i += 2) {
    processedList.push({
      name: list[i],
      value: Number(list[i + 1]),
    })
  }
  return processedList
}
