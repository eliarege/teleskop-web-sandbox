import type { CommandParameter } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

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
  const lines = splitLines(content)

  for (const line of lines) {
    const tokens = tokenize(line)

    const parameter: CommandParameter = {
      commandNo: tokens.get(0, 'integer'),
      name: tokens.get(2, 'string'),
      paramName: tokens.get(3, 'string'),
      paramFormula: tokens.get(4, 'string'),
      binding: tokens.get(5, 'integer'),
      defaultValue: tokens.get(6, 'float'),
      minValue: tokens.get(7, 'float'),
      maxValue: tokens.get(8, 'float'),
      graphic: tokens.get(9, 'integer'),
      selectionList: null,
    }

    // Check if index 10 is a list or an integer
    if (tokens.length > 10) {
      try {
        const listValue = tokens.get(10, 'list')
        if (listValue.length > 0) {
          parameter.selectionList = listValue
          // Check for machine constant IDs after the list
          if (tokens.length > 12) {
            parameter.machineConstantIdMin = tokens.get(11, 'integer')
            parameter.machineConstantIdMax = tokens.get(12, 'integer')
          }
        } else {
          // Empty list, check for machine constant IDs
          if (tokens.length > 11) {
            parameter.machineConstantIdMin = tokens.get(10, 'integer')
            parameter.machineConstantIdMax = tokens.get(11, 'integer')
          }
        }
      } catch {
        // Not a list, treat as machine constant IDs
        parameter.machineConstantIdMin = tokens.get(10, 'integer')
        parameter.machineConstantIdMax = tokens.get(11, 'integer')
      }
    }

    parameters.push(parameter)
  }
  return parameters
}
