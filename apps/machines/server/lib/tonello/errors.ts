import type { TonelloErrorObject } from '../types'

export const MISSING_LOCALE_ERROR = 'MissingLocaleError'
export const INVALID_PARAMETER_TYPE_ERROR = 'InvalidParameterTypeError'

export class TonelloUpdateError extends Error {
  constructor(message: string, public errors: TonelloErrorObject[]) {
    super(message)
    this.name = 'TonelloUpdateError'
  }
}
