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

const pattern = /^SABIT_(\d+)=(.+), (.+), (.+), (.+), (.+), (.+), ([^,]*),(?:([^,]*),)?(\[.*\])$/gim

/**
 * **Path**: `/tbb6500/data/config/baslatmaParametreleri`
 *
 * **Example**:
 * ```
 * SABIT_0=Kilo, 1, 0, 2000, -9999, 1, 1,9600,[]"
 * ```
 */
export function parseBatchParameters(content: string) {
  const reasons = []
  let match = pattern.exec(content)
  while (match !== null) {
    const list = JSON.parse(match[10])
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

    const reason = {
      batchParameterId: Number.parseInt(match[1]),
      paramString: match[2],
      format: match[3],
      min: Number.parseInt(match[4]),
      max: Number.parseInt(match[5]),
      default: Number.parseInt(match[6]),
      unitCode: Number.parseInt(match[7]),
      unitText: unitMap[Number.parseInt(match[7])],
      parameterId: Number.parseInt(match[8]),
      dmArea: match[9] ? Number.parseInt(match[9]) : null,
      selectionList,
      selectionValues,
      selectionListDefault,
    }
    reasons.push(reason)
    match = pattern.exec(content)
  }
  return reasons
}
