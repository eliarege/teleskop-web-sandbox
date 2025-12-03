import type { BatchParameter } from '../types'

const unitMap = [
  '---',
  'Kg',
  'lt',
  'sec',
  'min',
  'C',
  '%',
  'pH',
  'mbar',
  'lt/min',
  'm/min',
  'bar',
  'rpm',
  'Sie',
  'm',
  'kWh',
  'CC',
  'Lt/Kg',
  'gr/lt',
  '°C/min',
  'cm',
  'mS/cm',
  'K',
  'gr/mt-lin',
  'gr/mt',
  'inch',
  'g',
  'Lb',
  'Galon',
  'F',
  'Feet',
  'Galon/min',
  'Feet/min',
  'Galon/Lb',
  'oz/Galon',
  'F/min',
  'oz/Feet',
]

/**
 * **Path**: `/tbb6500/data/config/baslatmaParametreleri`
 *
 * **Example**:
 * ```
 * SABIT_0=Kilo, 1, 0, 2000, -9999, 1, 1,9600, []"
 * SABIT_11=Wss Yoğun Yıkama, 0, 0, 1, 0, 0, 0,9611,["Hayır","0",1,"Evet","1",0]
 * SABIT_12=Ornek, 0, 0, 30000, -9999, 1, 1,["t","1",1,"s","2",0,"e","3",0],1,8,12
 * ```
 */
export function parseBatchParameters(content: string): BatchParameter[] {
  const parameters: BatchParameter[] = []

  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('SABIT_'))

  for (const line of lines) {
    const parts = line.split(/[\[\]]/).map(e => e.trim())
    if (parts.length < 1)
      continue

    const keyValue = parts[0]
    const listString = parts[1] ?? ''
    const afterList = parts[2] ?? ''

    const keyValueParts = keyValue.split('=')
    if (keyValueParts.length < 2)
      continue

    const id = Number(keyValueParts[0].slice(6))
    const entries = keyValueParts[1].split(',').map(e => e.trim())

    if (entries.length < 8)
      continue

    const list = JSON.parse(`[${listString}]`)
    const selectionList: string[] = []
    const selectionValues: string[] = []
    let selectionListDefault: string | null = null

    for (let i = 0; i < list.length; i += 3) {
      selectionList.push(list[i])
      selectionValues.push(list[i + 1])

      if (list[i + 2] === 1) {
        selectionListDefault = list[i + 1]
      }
    }

    const parameter: BatchParameter = {
      batchParameterId: id,
      paramString: entries[0],
      format: entries[1],
      min: Number(entries[2]),
      max: Number(entries[3]),
      default: Number(entries[4]),
      unitCode: Number(entries[5]),
      unitText: unitMap[Number(entries[5])] || '',
      parameterId: Number(entries[6]) || 0,
      dmArea: Number(entries[7]) || null,
      selectionList,
      selectionValues,
      selectionListDefault,
    }

    const afterListEntries = afterList.split(',').map(e => e.trim())
    if (afterListEntries.length > 1) {
      if (afterListEntries[1]) {
        parameter.visibility = afterListEntries[1] === '1'
      }
      if (afterListEntries[2]) {
        parameter.machineConstantIdMin = Number.parseInt(afterListEntries[2]) || -1
      }
      if (afterListEntries[3]) {
        parameter.machineConstantIdMax = Number.parseInt(afterListEntries[3]) || -1
      }
    }

    parameters.push(parameter)
  }

  return parameters
}
