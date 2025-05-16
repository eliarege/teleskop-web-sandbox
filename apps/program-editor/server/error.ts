export type ErrorCode =
  | 'MACHINE_NOT_FOUND'
  | 'MACHINE_UNAVAILABLE'
  | 'MACHINE_IP_NOT_FOUND'
  | 'PROGRAM_NOT_FOUND'
  | 'PROGRAM_EXISTS'
  | 'PROGRAM_INVALID'
  | 'PROGRAM_ARCHIVE_NOT_FOUND'
  | 'PROGRAM_FAILED_TO_LOAD'
  | 'PROGRAM_INSERT_FAILED'
  | 'PROGRAM_UPDATE_FAILED'
  | 'PROGRAM_TREATMENT_COMMAND_LIMIT'
  | 'NO_COMMANDS_FOUND'
  | 'INVALID_MACHINE_OR_PROGRAM_NUMBER'
  | 'COMMAND_NOT_FOUND'
  | 'PROGRAM_IO_NOT_FOUND'
  | 'MACHINE_PARAMETER_NOT_FOUND'
  | 'PROGRAM_HAS_ERRORS'

export interface ErrorMachineDetail {
  machineId: number
}

export interface ErrorProgramDetail {
  machineId: number
  programNo: number
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

export interface ErrorMachineNotFound extends PError {
  code: 'MACHINE_NOT_FOUND'
  detail: ErrorMachineDetail
}

export interface ErrorMachineUnavailable extends PError {
  code: 'MACHINE_UNAVAILABLE'
  detail: ErrorMachineDetail
}

export interface ErrorMachineIpNotFound extends PError {
  code: 'MACHINE_IP_NOT_FOUND'
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

export interface ErrorInvalidMachineOrProgramNumber extends PError {
  code: 'INVALID_MACHINE_OR_PROGRAM_NUMBER'
  detail: ErrorProgramDetail
}

export interface ErrorCommandNotFound extends PError {
  code: 'COMMAND_NOT_FOUND'
  detail: ErrorCommandDetail
}

export interface ErrorProgramIoNotFound extends PError {
  code: 'PROGRAM_IO_NOT_FOUND'
  detail: ErrorProgramIoDetail
}

export interface ErrorMachineParameterNotFound extends PError {
  code: 'MACHINE_PARAMETER_NOT_FOUND'
  detail: ErrorMachineParameterDetail
}

export interface ErrorProgramHasErrors extends PError {
  code: 'PROGRAM_HAS_ERRORS'
  detail: ErrorProgramDetail
}

export type AnyError =
  | ErrorMachineNotFound
  | ErrorMachineUnavailable
  | ErrorProgramExists
  | ErrorProgramInvalid
  | ErrorProgramNotFound
  | ErrorProgramArchiveNotFound
  | ErrorProgramLoad
  | ErrorProgramInsert
  | ErrorProgramUpdate
  | ErrorTreatmentLimit
  | ErrorNoCommandsFound
  | ErrorInvalidMachineOrProgramNumber
  | ErrorCommandNotFound
  | ErrorProgramIoNotFound
  | ErrorMachineParameterNotFound
  | ErrorProgramHasErrors

export class PError extends Error {
  code: ErrorCode
  detail: any

  constructor(code: 'MACHINE_NOT_FOUND', detail: ErrorMachineDetail)
  constructor(code: 'MACHINE_UNAVAILABLE', detail: ErrorMachineDetail)
  constructor(code: 'MACHINE_IP_NOT_FOUND', detail: ErrorMachineDetail)
  constructor(code: 'PROGRAM_NOT_FOUND', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_EXISTS', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_INVALID', detail: ErrorProgramInvalidDetail)
  constructor(code: 'PROGRAM_ARCHIVE_NOT_FOUND', detail: ErrorProgramArchiveNotFound)
  constructor(code: 'PROGRAM_FAILED_TO_LOAD', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_INSERT_FAILED', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_UPDATE_FAILED', detail: ErrorProgramDetail)
  constructor(code: 'PROGRAM_TREATMENT_COMMAND_LIMIT', detail: ErrorTreatmentLimitDetail)
  constructor(code: 'NO_COMMANDS_FOUND', detail: ErrorMachineDetail)
  constructor(code: 'INVALID_MACHINE_OR_PROGRAM_NUMBER', detail: ErrorProgramDetail)
  constructor(code: 'COMMAND_NOT_FOUND', detail: ErrorCommandDetail)
  constructor(code: 'PROGRAM_IO_NOT_FOUND', detail: ErrorProgramIoDetail)
  constructor(code: 'MACHINE_PARAMETER_NOT_FOUND', detail: ErrorMachineParameterDetail)
  constructor(code: 'PROGRAM_HAS_ERRORS', detail: ErrorProgramHasErrors)

  constructor(code: ErrorCode, detail?: any) {
    super(code)
    this.code = code
    this.detail = detail
  }
}

export function isPError(error: unknown): error is AnyError {
  return error instanceof PError
}
