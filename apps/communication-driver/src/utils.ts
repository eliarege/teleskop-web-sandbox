import type { TonelloIoType } from '@teleskop/core'
import { TonelloAutoMode, TonelloChemicalRequestStatus, TonelloChemicalRequestType } from '@teleskop/core'
import type { IoType } from './db/enums'
import { AutoManualStatus, MaterialType, RequestStatus } from './db/enums'

/**
 * Formats a Date to a `'yyyy-MM-dd'` string, used as the `date` param
 * for `TonelloApi.fetchEvents` and stored in `MachineStatus.lastEventDate`.
 */
export function extractDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Returns elapsed time in whole seconds between two dates. */
export function diffInSeconds(end: Date, start: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 1000)
}

/** Maps `TonelloChemicalRequestType` to the internal `MaterialType` enum. */
export function mapTonelloChemicalRequestType(type: TonelloChemicalRequestType): MaterialType {
  // TonelloChemicalRequestType: Chemical=0, Dye=1, Salt=2, Other=3
  // MaterialType: Chemical=0, Dye=1
  // Salt and Other fall back to Chemical
  if (type === TonelloChemicalRequestType.Dye)
    return MaterialType.Dye
  return MaterialType.Chemical
}

/** Maps `TonelloIoType` string codes to the internal `IoType` enum numbers. */
export function mapTonelloIoType(type: TonelloIoType): IoType {
  // TonelloIoType: '1'=AnalogInput, '2'=AnalogOutput, '3'=DigitalInput, '4'=DigitalOutput, '5'=Counter
  // IoType: AnalogInput=1, AnalogOutput=2, DigitalInput=3, DigitalOutput=4, Counter=5
  return Number(type) as IoType
}

export function mapTonelloAutoModeToAutoManualStatus(autoMode: TonelloAutoMode): AutoManualStatus {
  // TonelloAutoMode: '0'=False, '1'=True
  // AutoManualStatus: Unknown=-1, Auto=0, Manual=1
  if (autoMode === TonelloAutoMode.True)
    return AutoManualStatus.Auto
  if (autoMode === TonelloAutoMode.False)
    return AutoManualStatus.Manual
  return AutoManualStatus.Unknown
}

/** Maps `RequestStatus` to `TonelloChemicalRequestStatus` for sending responses back to the machine. */
export function mapRequestStatusToTonello(status: RequestStatus): TonelloChemicalRequestStatus {
  switch (status) {
    case RequestStatus.New:
    case RequestStatus.TransferredToDispenser:
      return TonelloChemicalRequestStatus.Received
    case RequestStatus.Started:
      return TonelloChemicalRequestStatus.Working
    case RequestStatus.Completed:
      return TonelloChemicalRequestStatus.Done
    case RequestStatus.Cancelled:
      return TonelloChemicalRequestStatus.Error
    default:
      return TonelloChemicalRequestStatus.Received
  }
}

/** Serialises a number array to a string for DB storage using the given separator. Returns `null` for null/empty lists. */
export function joinNumberList(list: number[] | null | undefined, separator = ','): string | null {
  if (!list || list.length === 0)
    return null
  return list.join(separator)
}

/** Parses a DB string to a number array using the given separator. Returns an empty array for null/empty values. */
export function splitNumberList(value: unknown, separator = ','): number[] {
  if (typeof value !== 'string' || !value)
    return []
  return value.split(separator).filter(Boolean).map(Number)
}

/** Returns a new Date shifted forward by the given number of minutes. */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

/** Returns a new Date shifted backward by the given number of minutes. */
export function subMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60_000)
}

export function subMilliseconds(date: Date, milliseconds: number): Date {
  return new Date(date.getTime() - milliseconds)
}

/** Adjusts a Date **from** the database by the given timezone offset. Returns `null` for null/undefined values. */
export function adjustFromDbDate(date: Date, tzOffset: number): Date
export function adjustFromDbDate(date: Date | null | undefined, tzOffset: number): Date | null
export function adjustFromDbDate(date: Date | null | undefined, tzOffset: number): Date | null {
  return date != null ? addMinutes(date, tzOffset) : null
}

/** Adjusts a Date **to** the database by the given timezone offset. Returns `null` for null/undefined values. */
export function adjustToDbDate(date: Date, tzOffset: number): Date
export function adjustToDbDate(date: Date | null | undefined, tzOffset: number): Date | null
export function adjustToDbDate(date: Date | null | undefined, tzOffset: number): Date | null {
  return date != null ? subMinutes(date, tzOffset) : null
}

export function tryJsonParse<T>(str: string): T | null {
  if (!str) {
    return null
  }
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}
