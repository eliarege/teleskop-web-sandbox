import type { FinishReason } from '~/types'

// '../../tbb6500/data/config/bitirmenedenleri'
const typeIdMap = {
  3: 'Bitir',
  4: 'Atla',
  5: 'Makine Duraklatma',
}

export function fileFinishReasonWriter(reasons: FinishReason[]): string {
  const regexStrings = reasons.map(reason => `${reason.reasonId} "${reason.text}" ${reason.typeId} "${typeIdMap[reason.typeId]}"`)
  return regexStrings.join('\n')
}
