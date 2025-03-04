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

// const pattern = /^SABIT_(\d+)=(.+), (.+), (.+), (.+), (.+), (.+), ([^\n,]*),(?:([^\n,]*),)?(\[.*\])$/gim
// const pattern = /^SABIT_(\d+)=(.+),(.+)$/gim
/**
 * **Path**: `/tbb6500/data/config/baslatmaParametreleri`
 *
 * **Example**:
 * ```
 * SABIT_0=Kilo, 1, 0, 2000, -9999, 1, 1,9600, []"
 * SABIT_11=Wss Yoğun Yıkama, 0, 0, 1, 0, 0, 0,9611,["Hayır","0",1,"Evet","1",0]
 * ```
 */
export function parseBatchParameters(content: string) {
  const reasons = []

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

    const reason = {
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

    reasons.push(reason)
  }

  return reasons
}
