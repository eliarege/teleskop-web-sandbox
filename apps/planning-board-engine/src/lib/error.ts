const codeStatusMap = {
  PROGRAM_NOT_FOUND: 404,
  COMMAND_NOT_FOUND: 404,
  MACHINE_PARAMETER_NOT_FOUND: 404,
  MACHINE_PARAMETER_INVALID: 400,
  MACHINE_PARAMETER_TYPE_ERROR: 400,
} as const

type PErrorCode = keyof typeof codeStatusMap | string & Record<never, never>

export class PError extends Error {
  code: string
  details: Record<string, any>
  statusCode: number

  constructor(code: PErrorCode, details: Record<string, any> = {}) {
    super(code)
    this.code = code
    this.details = details
    this.statusCode = (codeStatusMap as Record<string, number>)[code] || 500
  }
}
