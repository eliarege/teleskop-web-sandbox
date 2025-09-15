import type { TonelloLocalizedMessage } from './tonello/locale'

export type TonelloErrorObject = {
  code: string
  details: Record<string, unknown>
}

export interface UpdateContext {
  errors: TonelloErrorObject[]
  messages: TonelloLocalizedMessage[][]
}
