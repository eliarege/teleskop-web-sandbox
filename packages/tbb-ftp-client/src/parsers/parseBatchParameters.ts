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

const pattern = /^SABIT_(\d+)=(.+),(.+)$/gim

/**
 * **Path**: `/tbb6500/data/config/baslatmaParametreleri`
 *
 * **Example**:
 * ```
 * SABIT_0=Kilo, 1, 0, 2000, -9999, 1, 1,9600, []"
 * ```
 */
export function parseBatchParameters(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const list = JSON.parse(match[3])
    const selectionList = []
    const selectionValues = []
    let selectionListDefault = null as string | null

    if (list && list.length) {
      for (let i = 0; i < list.length; i += 3) {
        selectionList.push(list[i])
        selectionValues.push(list[i + 1])
        const isDefault = list[i + 2] === 1
        if (isDefault) {
          selectionListDefault = list[i + 1]
        }
      }
    }

    const id = Number.parseInt(match[1])
    const entries = match[2].split(',').map(e => e.trim())

    const reason = {
      batchParameterId: id,
      paramString: entries[0],
      format: entries[1],
      min: Number.parseInt(entries[2]),
      max: Number.parseInt(entries[3]),
      default: Number.parseInt(entries[4]),
      unitCode: Number.parseInt(entries[5]),
      unitText: unitMap[Number.parseInt(entries[5])],
      parameterId: Number.parseInt(entries[6]),
      dmArea: entries[7] ? Number.parseInt(entries[7]) : null,
      selectionList,
      selectionValues,
      selectionListDefault,
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
