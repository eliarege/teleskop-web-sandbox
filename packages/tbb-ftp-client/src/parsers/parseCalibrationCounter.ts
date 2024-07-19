const pattern = /^(\d+) (\d+) (.+) (.+)$/gim
/**
 * **Path**: `/tbb6500/data/kalibrasyon/sayackalibrasyon`
 *
 * **Example**:
 * ```txt
 * 2 2 kWh 100
 * 3 0 lt 9.700
 * ```
 */
export function parseCalibrationCounter(content: string) {
  const inputs = []
  let match = pattern.exec(content)
  while (match !== null) {
    const input = {
      id: Number.parseInt(match[1]),
      format: Number.parseInt(match[2]),
      unit: match[3],
      pulse: Number.parseInt(match[4]),
    }
    inputs.push(input)
    match = pattern.exec(content)
  }
  return inputs
}
