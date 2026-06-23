export type ErrorCode =
  | 'MACHINE_NOT_FOUND'
  | 'MACHINE_UNAVAILABLE'
  | 'MACHINE_OFFLINE'
  | 'PROGRAM_NOT_FOUND'
  | 'PROGRAM_EXISTS'
  | 'PROGRAM_INVALID'
  | 'PROGRAM_ARCHIVE_NOT_FOUND'
  | 'PROGRAM_FAILED_TO_LOAD'
  | 'PROGRAM_FAILED_TO_DOWNLOAD'
  | 'PROGRAM_INSERT_FAILED'
  | 'PROGRAM_UPDATE_FAILED'
  | 'PROGRAM_TREATMENT_COMMAND_LIMIT'
  | 'NO_COMMANDS_FOUND'
  | 'INVALID_MACHINE_OR_PROGRAM_NUMBER'
  | 'INVALID_MACHINE_NUMBER'
  | 'INVALID_PROGRAM_NUMBER'
  | 'INVALID_PROGRAM_NUMBERS'
  | 'INVALID_VERSION_NUMBER'
  | 'INVALID_VERSION_LIST'
  | 'PROGRAM_VERSION_NOT_FOUND'
  | 'INVALID_COMMAND_NUMBER'
  | 'COMMAND_NOT_FOUND'
  | 'PROGRAM_IO_NOT_FOUND'
  | 'MACHINE_PARAMETER_NOT_FOUND'
  | 'MACHINE_PARAMETER_TYPE_ERROR'
  | 'MACHINE_PARAMETER_INVALID'
  | 'PROGRAM_HAS_ERRORS'
  | 'NO_TARGETS'
  | 'NO_REPLACE_VALUES'
  | 'INVALID_PARAMS'

export interface ErrorMachineDetail {
  machineId: number
}

export interface ErrorProgramDetail {
  machineId: number
  programNo: number
}

export interface ErrorProgramsDetail {
  machineId: number
  programNos: number[]
}

export interface ErrorProgramArchiveDetail {
  machineId: number
  programNo: number
  versionNo: number
}

export interface ErrorProgramInvalidDetail {
  machineId: number
  programNo: number
  reason: any
}

export interface ErrorTreatmentLimitDetail {
  machineId: number
  programNo: number
  commandNo: number
  limit: number
}

export interface ErrorCommandDetail {
  machineId: number
  commandNo: number
}

export interface ErrorProgramCommandDetail {
  machineId: number
  programNo: number
  commandNo: number
}

export interface ErrorProgramIoDetail {
  machineId: number
  programNo: number
  commandNo: number
  ioIndex: number
}

export interface ErrorMachineParameterDetail {
  machineId: number
  programNo: number
  commandNo: number
  parameterIndex: number
}

export interface ErrorMachineParameterTypeDetail {
  machineId: number
  programNo: number
  commandNo: number
  parameterIndex: number
  expected: string
}

export interface ErrorMachineNotFound extends PError {
  code: 'MACHINE_NOT_FOUND'
  detail: ErrorMachineDetail
}

export interface ErrorMachineUnavailable extends PError {
  code: 'MACHINE_UNAVAILABLE'
  detail: ErrorMachineDetail
}

export interface ErrorProgramNotFound extends PError {
  code: 'PROGRAM_NOT_FOUND'
  detail: ErrorProgramDetail
}

export interface ErrorProgramExists extends PError {
  code: 'PROGRAM_EXISTS'
  detail: ErrorProgramDetail
}

export interface ErrorProgramInvalid extends PError {
  code: 'PROGRAM_INVALID'
  detail: ErrorProgramInvalidDetail
}

export interface ErrorProgramArchiveNotFound extends PError {
  code: 'PROGRAM_ARCHIVE_NOT_FOUND'
  detail: ErrorProgramArchiveDetail
}

export interface ErrorProgramLoad extends PError {
  code: 'PROGRAM_FAILED_TO_LOAD'
  detail: ErrorProgramDetail
}

export interface ErrorProgramDownload extends PError {
  code: 'PROGRAM_FAILED_TO_DOWNLOAD'
  detail: ErrorProgramDetail
}

export interface ErrorProgramInsert extends PError {
  code: 'PROGRAM_INSERT_FAILED'
  detail: ErrorProgramDetail
}

export interface ErrorProgramUpdate extends PError {
  code: 'PROGRAM_UPDATE_FAILED'
  detail: ErrorProgramDetail
}

export interface ErrorTreatmentLimit extends PError {
  code: 'PROGRAM_TREATMENT_COMMAND_LIMIT'
  detail: ErrorTreatmentLimitDetail
}

export interface ErrorNoCommandsFound extends PError {
  code: 'NO_COMMANDS_FOUND'
  detail: ErrorProgramDetail
}

export interface ErrorInvalidMachineNumber extends PError {
  code: 'INVALID_MACHINE_NUMBER'
  detail: ErrorMachineDetail
}

export interface ErrorInvalidProgramNumber extends PError {
  code: 'INVALID_PROGRAM_NUMBER'
  detail: ErrorProgramDetail
}

export interface ErrorInvalidProgramNumbers extends PError {
  code: 'INVALID_PROGRAM_NUMBERS'
  detail: ErrorProgramsDetail
}

export interface ErrorInvalidCommandNumber extends PError {
  code: 'INVALID_COMMAND_NUMBER'
  detail: ErrorCommandDetail
}

export interface ErrorCommandNotFound extends PError {
  code: 'COMMAND_NOT_FOUND'
  detail: ErrorProgramCommandDetail
}

export interface ErrorProgramIoNotFound extends PError {
  code: 'PROGRAM_IO_NOT_FOUND'
  detail: ErrorProgramIoDetail
}

export interface ErrorMachineParameterNotFound extends PError {
  code: 'MACHINE_PARAMETER_NOT_FOUND'
  detail: ErrorMachineParameterDetail
}

export interface ErrorMachineParameterTypeError extends PError {
  code: 'MACHINE_PARAMETER_TYPE_ERROR'
  detail: ErrorMachineParameterTypeDetail
}

export interface ErrorMachineParameterInvalid extends PError {
  code: 'MACHINE_PARAMETER_INVALID'
  detail: ErrorMachineParameterDetail & { reason: string }
}

export interface ErrorProgramHasErrors extends PError {
  code: 'PROGRAM_HAS_ERRORS'
  detail: ErrorProgramDetail
}

export interface ErrorEmptyDetail {}

export interface ErrorNoTargets extends PError {
  code: 'NO_TARGETS'
  detail: ErrorEmptyDetail
}

export interface ErrorNoReplaceValues extends PError {
  code: 'NO_REPLACE_VALUES'
  detail: ErrorEmptyDetail
}

export type AnyError =
  | ErrorMachineNotFound
  | ErrorMachineUnavailable
  | ErrorProgramExists
  | ErrorProgramInvalid
  | ErrorProgramNotFound
  | ErrorProgramArchiveNotFound
  | ErrorProgramLoad
  | ErrorProgramDownload
  | ErrorProgramInsert
  | ErrorProgramUpdate
  | ErrorTreatmentLimit
  | ErrorNoCommandsFound
  | ErrorInvalidMachineNumber
  | ErrorInvalidProgramNumber
  | ErrorInvalidProgramNumbers
  | ErrorInvalidCommandNumber
  | ErrorCommandNotFound
  | ErrorProgramIoNotFound
  | ErrorMachineParameterNotFound
  | ErrorMachineParameterTypeError
  | ErrorMachineParameterInvalid
  | ErrorProgramHasErrors
  | ErrorNoTargets
  | ErrorNoReplaceValues

export class PError extends Error {
  code: ErrorCode
  detail: any

  constructor(code: 'MACHINE_NOT_FOUND', detail: ErrorMachineDetail)
  constructor(code: 'MACHINE_UNAVAILABLE', detail: ErrorMachineDetail)
  constructor(code: 'MACHINE_OFFLINE', detail: ErrorMachineDetail)
  constructor(code: 'PROGRAM_NOT_FOUND', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_EXISTS', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_INVALID', detail: ErrorProgramInvalidDetail)
  constructor(code: 'PROGRAM_ARCHIVE_NOT_FOUND', detail: ErrorProgramArchiveNotFound)
  constructor(code: 'PROGRAM_FAILED_TO_LOAD', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_FAILED_TO_DOWNLOAD', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_INSERT_FAILED', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_UPDATE_FAILED', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_TREATMENT_COMMAND_LIMIT', detail: ErrorTreatmentLimitDetail)
  constructor(code: 'NO_COMMANDS_FOUND', detail: ErrorMachineDetail)
  constructor(code: 'INVALID_MACHINE_OR_PROGRAM_NUMBER', detail: ErrorProgramDetail)
  constructor(code: 'INVALID_MACHINE_NUMBER', detail: ErrorMachineDetail)
  constructor(code: 'INVALID_PROGRAM_NUMBER', detail: ErrorProgramDetail)
  constructor(code: 'INVALID_PROGRAM_NUMBERS', detail: ErrorProgramsDetail)
  constructor(code: 'INVALID_VERSION_NUMBER', detail: ErrorProgramArchiveDetail)
  constructor(code: 'INVALID_VERSION_LIST', detail: any)
  constructor(code: 'PROGRAM_VERSION_NOT_FOUND', detail: ErrorProgramArchiveDetail)
  constructor(code: 'INVALID_COMMAND_NUMBER', detail: ErrorCommandDetail)
  constructor(code: 'COMMAND_NOT_FOUND', detail: ErrorProgramCommandDetail)
  constructor(code: 'PROGRAM_IO_NOT_FOUND', detail: ErrorProgramIoDetail)
  constructor(code: 'MACHINE_PARAMETER_NOT_FOUND', detail: ErrorMachineParameterDetail)
  constructor(code: 'MACHINE_PARAMETER_TYPE_ERROR', detail: ErrorMachineParameterTypeDetail)
  constructor(code: 'MACHINE_PARAMETER_INVALID', detail: ErrorMachineParameterDetail & { reason: string })
  constructor(code: 'PROGRAM_HAS_ERRORS', detail: ErrorProgramDetail)
  constructor(code: 'NO_TARGETS', detail: ErrorEmptyDetail)
  constructor(code: 'NO_REPLACE_VALUES', detail: ErrorEmptyDetail)
  constructor(code: 'INVALID_PARAMS', detail: ErrorCommandDetail)

  constructor(code: ErrorCode, detail?: any) {
    super(code)
    this.code = code
    this.detail = detail
  }
}

export function isPError(error: unknown): error is AnyError {
  return error instanceof PError
}

/**
 * Convert a PError (or generic Error) into a human-friendly message.
 * Used in bulk operation result dialogs where raw error codes like
 * "COMMAND_NOT_FOUND" are not meaningful to end users.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof PError) {
    switch (error.code) {
      case 'COMMAND_NOT_FOUND': {
        const d = error.detail as ErrorProgramCommandDetail
        return `Command ${d.commandNo} not found on machine (program ${d.programNo})`
      }
      case 'PROGRAM_IO_NOT_FOUND': {
        const d = error.detail as ErrorProgramIoDetail
        return `I/O ${d.ioIndex} not found on command ${d.commandNo} (program ${d.programNo})`
      }
      case 'MACHINE_PARAMETER_NOT_FOUND': {
        const d = error.detail as ErrorMachineParameterDetail
        return `Parameter ${d.parameterIndex} not found on command ${d.commandNo} (program ${d.programNo})`
      }
      case 'MACHINE_PARAMETER_INVALID': {
        const d = error.detail as ErrorMachineParameterDetail & { reason: string }
        return `Invalid parameter ${d.parameterIndex} on command ${d.commandNo} (program ${d.programNo}): ${d.reason}`
      }
      case 'PROGRAM_FAILED_TO_DOWNLOAD': {
        const d = error.detail as ErrorProgramDetail
        return `Failed to download program ${d.programNo} from machine`
      }
      case 'PROGRAM_FAILED_TO_LOAD': {
        const d = error.detail as ErrorProgramDetail
        return `Failed to load program ${d.programNo}`
      }
      case 'PROGRAM_INSERT_FAILED': {
        const d = error.detail as ErrorProgramDetail
        return `Failed to save program ${d.programNo} to database`
      }
      case 'PROGRAM_UPDATE_FAILED': {
        const d = error.detail as ErrorProgramDetail
        return `Failed to update program ${d.programNo} in database`
      }
      case 'PROGRAM_TREATMENT_COMMAND_LIMIT': {
        const d = error.detail as ErrorTreatmentLimitDetail
        return `Treatment command limit exceeded on command ${d.commandNo} (program ${d.programNo}, limit: ${d.limit})`
      }
      case 'NO_COMMANDS_FOUND': {
        const d = error.detail as ErrorProgramDetail
        return `Machine command list is empty (program ${d.programNo})`
      }
      case 'PROGRAM_NOT_FOUND': {
        const d = error.detail as ErrorProgramDetail
        return `Program ${d.programNo} not found`
      }
      case 'PROGRAM_INVALID': {
        const d = error.detail as ErrorProgramInvalidDetail
        return `Program ${d.programNo} is invalid: ${d.reason}`
      }
      case 'MACHINE_NOT_FOUND': {
        const d = error.detail as ErrorMachineDetail
        return `Machine ${d.machineId} not found`
      }
      case 'MACHINE_UNAVAILABLE':
        return 'Machine is unavailable'
      case 'MACHINE_OFFLINE':
        return 'Machine is offline'
      case 'INVALID_COMMAND_NUMBER': {
        const d = error.detail as ErrorCommandDetail
        return `Invalid command number ${d.commandNo}`
      }
      case 'INVALID_PROGRAM_NUMBER': {
        const d = error.detail as ErrorProgramDetail
        return `Invalid program number ${d.programNo}`
      }
      case 'INVALID_VERSION_NUMBER': {
        const d = error.detail as ErrorProgramArchiveDetail
        return `Invalid version number ${d.versionNo} (program ${d.programNo})`
      }
      default:
        return error.code.replace(/_/g, ' ').toLowerCase()
    }
  }
  return error instanceof Error ? error.message : 'Unknown error'
}
