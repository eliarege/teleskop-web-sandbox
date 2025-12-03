import type { FeedbackCommand } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/commands/feedback`
 *
 * **Example**:
 * ```txt
 * 15 0 "PV 1" "Çalisma Süresi" 1 1
 * ```
 */
export function parseCommandFeedback(content: string) {
  const lines = splitLines(content)
  const groups: FeedbackCommand[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const group: FeedbackCommand = {
      commandNo: tokens.get(0, 'integer'),
      format: tokens.get(1, 'integer'),
      pvNo: tokens.get(2, 'string'),
      returnValueName: tokens.get(3, 'string'),
      canShow: tokens.get(4, 'integer'),
      SPRelation: tokens.get(5, 'integer'),
    }
    groups.push(group)
  }
  return groups
}
