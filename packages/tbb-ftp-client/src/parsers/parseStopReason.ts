import type { StopReason } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/config/durusnedenleri`
 *
 * **Example**:
 * ```txt
 * 1 "Ham Açma Bekleme"
 * 2 "İki Parti Arası Hazırlık"
 * 3 "Sipariş Yok"
 * 4 "Reçete Yok"
 * ```
 */
export function parseStopReason(content: string) {
  const lines = splitLines(content)
  const reasons: Partial<StopReason>[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const reason: Partial<StopReason> = {
      stopCode: tokens.get(0, 'integer'),
      stopName: tokens.get(1, 'string'),
    }
    reasons.push(reason)
  }
  return reasons
}

export function serializeStopReason(reasons: StopReason[]): string {
  const regexStrings = reasons.map(reason => `${reason.stopCode} "${reason.stopName}"`)
  return regexStrings.join('\n')
}
