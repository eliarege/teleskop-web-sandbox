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

export type AnyError =
  | ErrorMachineNotFound
  | ErrorMachineUnavailable
  | ErrorProgramExists
  | ErrorProgramInvalid
  | ErrorProgramNotFound
  | ErrorProgramArchiveNotFound
  | ErrorProgramLoad
  | ErrorProgramInsert

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
  constructor(code: ErrorCode, detail?: any) {
    super(code)
    this.code = code
    this.detail = detail
  }
}

export function isPError(error: unknown): error is AnyError {
  return error instanceof PError
}
