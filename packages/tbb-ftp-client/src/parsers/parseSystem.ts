import { splitLines, splitOnce } from '../utils/common'

/**
 *
 * Cihaz sistem ayarlarının saklandığı dosyayı parse eder.
 *
 * **Path**: `/tbb6500/data/config/sistem`
 *
 * **Example**:
 * ```
 * BATCH_NO_DIGIT_COUNT=0
 * ```
 */
export function parseSystem(content: string): Record<string, any> {
  const system: Record<string, any> = {}
  const lines = splitLines(content)

  lines.forEach((line) => {
    const [key, value] = splitOnce(line, '=')
    if (key && value) {
      system[key] = value
    }
  })

  return system
}

export function serializeSystem(data: Record<string, string>) {
  let content = ''
  for (const key in data) {
    const value = data[key]
    content += `${key}=${value}\n`
  }
  return content
}
