import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import type { Buffer } from 'node:buffer'
import unzipper from 'unzipper'
import type { FastifyRequest } from 'fastify/types/request'
import type { AnalogValue, Batch, BatchArchivePaths, CalculatedValue, DigitalValue, ReelCycleTime, VirtualInputValue } from './types'

/** Convert timezone offset in minutes to ISO 8601 format */
function getTimezoneOffsetISO(offset: number) {
  if (offset === 0)
    return 'Z'
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  const sign = offset <= 0 ? '+' : '-'
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** Convert Delphi TDateTime (days since 1899-12-30) to ISO string with timezone offset */
function delphiDateToIso(delphiDate: number, tzOffset: number): string {
  const base = new Date(Date.UTC(1899, 11, 30)) // 1899-12-30
  const millis = delphiDate * 24 * 60 * 60 * 1000
  return `${new Date(base.getTime() + millis).toISOString().slice(0, -1)}${getTimezoneOffsetISO(tzOffset)}`
}

/** Read Pascal-style string (1-byte length prefix) from buffer at given offset */
function readPascalString(buf: Buffer, offset: number) {
  const len = buf.readUInt8(offset)
  return buf.toString('utf8', offset + 1, offset + 1 + len)
}

/**
 * Delphi structure:
 * ```pas
 * TBaIOValuesRec = record
 *   logtime: TDateTime;
 *   ioType: byte;
 *   ioIndex: byte;
 *   ioValue: real;
 *   source: string[1];
 * end;
 * ```
 */
export function readAnalogValueFile(data: Buffer, tzOffset: number): AnalogValue[] {
  const recordSize = 32
  const output = [] as AnalogValue[]

  for (let offset = 0; offset < data.length; offset += recordSize) {
    const logtimeRaw = data.readDoubleLE(offset)
    const logtime = delphiDateToIso(logtimeRaw, tzOffset)

    const ioType = data.readUInt8(offset + 8)
    const ioIndex = data.readUInt8(offset + 9)
    const ioValue = data.readDoubleLE(offset + 16)

    output.push({ logtime, ioType, ioIndex, ioValue })
  }
  return output
}
/**
 * Delphi structure:
 * ```pas
 * TDioValRecV2 = record
 *   logtime: TDateTime;
 *   DOF, DOL, DI: String[32];
 * end;
 * ```
 */
export function readDigitalValueFile(data: Buffer, tzOffset: number): DigitalValue[] {
  const recordSize = 112
  const output = [] as DigitalValue[]

  for (let offset = 0; offset < data.length; offset += recordSize) {
    const logtimeRaw = data.readDoubleLE(offset)
    const logtime = delphiDateToIso(logtimeRaw, tzOffset)

    const DOF = readPascalString(data, offset + 8)
    const DOL = readPascalString(data, offset + 8 + 33)
    const DI = readPascalString(data, offset + 8 + 66)

    output.push({ logtime, DOF, DOL, DI })
  }
  return output
}

/**
 * Delphi structure:
 * ```pas
 * TCalcValueRec = record
 *   logtime: TDateTime;
 *   progNo: Integer;
 *   valueId: Integer;
 *   value: real;
 * end;
 * ```
 */
export function readCalculatedValueFile(data: Buffer, tzOffset: number): CalculatedValue[] {
  const recordSize = 24
  const output = [] as CalculatedValue[]

  for (let offset = 0; offset < data.length; offset += recordSize) {
    const logtimeRaw = data.readDoubleLE(offset)
    const logtime = delphiDateToIso(logtimeRaw, tzOffset)

    const progNo = data.readInt32LE(offset + 8)
    const valueId = data.readInt32LE(offset + 12)
    const value = data.readDoubleLE(offset + 16)

    output.push({ logtime, progNo, valueId, value })
  }
  return output
}

/**
 * Delphi structure:
 * ```pas
 * TViValRec = record
 *   logtime: TDateTime;
 *   ioId, ioValue: Integer;
 * end;
 * ```
 */
export function readVirtualInputValueFile(data: Buffer, tzOffset: number): VirtualInputValue[] {
  const recordSize = 16
  const output = [] as VirtualInputValue[]

  for (let offset = 0; offset < data.length; offset += recordSize) {
    const logtimeRaw = data.readDoubleLE(offset)
    const logtime = delphiDateToIso(logtimeRaw, tzOffset)

    const ioId = data.readInt32LE(offset + 8)
    const ioValue = data.readInt32LE(offset + 12)

    output.push({ logtime, ioId, ioValue })
  }
  return output
}

/**
 * Delphi structure:
 * ```pas
 * TBaCycleTimesRecV2 = record
 *   reelNo: byte;
 *   cycleCount: integer;
 *   cycleTime: integer;
 *   commandNo: byte;
 *   cycleDate: TDateTime;
 * end;
 * ```
 */
export function readCycleTimeFile(data: Buffer, tzOffset: number) {
  const recordSize = 24
  const output = [] as ReelCycleTime[]

  for (let offset = 0; offset < data.length; offset += recordSize) {
    const reelNo = data.readUInt8(offset)
    const cycleCount = data.readInt32LE(offset + 4)
    const cycleTime = data.readInt32LE(offset + 8)
    const commandNo = data.readUInt8(offset + 12)
    const cycleDateRaw = data.readDoubleLE(offset + 16)
    const cycleDate = delphiDateToIso(cycleDateRaw, tzOffset)

    output.push({ reelNo, cycleCount, cycleTime, commandNo, cycleDate })
  }
  return output
}

/**
 * Read file from path or from zip archive if exists. If neither exists, return null.
 * Throws on any other file read error.
 *
 * @param path File path, e.g. /path/to/12345.zip or /path/to/12345
 * @returns File content as Buffer or null if not found
 * @throws Error on file read errors other than not found
 */
export async function readArchiveFile(path: string): Promise<Buffer | null> {
  const withoutZip = withoutExt(path)
  const withZip = `${withoutZip}.zip`

  if (existsSync(withZip)) {
    const directory = await unzipper.Open.file(withZip)
    const fileName = basename(withZip, '.zip')
    const file = directory.files.find(d => d.path === fileName)
    if (!file)
      throw new Error(`File ${fileName} not found in archive ${withZip}`)
    return file.buffer()
  } else {
    return await readFile(withoutZip).catch((err) => {
      if (err.code === 'ENOENT') {
        return null
      }
      throw err
    })
  }
}

/**
 * Get the paths to the archive files for a specific batch.
 *
 * @param batch Batch metadata
 * @param baseDir Base directory for archives
 * @returns Paths to the archive files
 */
export function getArchivePaths(batch: Batch, baseDir: string): BatchArchivePaths {
  const yearMonth = batch.startTime.slice(0, 7).replace('-', '')
  const archiveDir = join(baseDir, `${batch.machineId}`, yearMonth)
  return {
    analogValuesPath: join(archiveDir, `${batch.batchKey}.zip`),
    digitalValuesPath: join(archiveDir, `${batch.batchKey}_DioValues_V2.zip`),
    calculatedValuesPath: join(archiveDir, `${batch.batchKey}_calcVals.zip`),
    virtualInputValuesPath: join(archiveDir, `${batch.batchKey}_ViValues.zip`),
    cycleTimesPath: join(archiveDir, `${batch.batchKey}_cycleTimesV2.zip`),
  }
}

/**
 * Get the path without the file extension.
 *
 * @param path File path
 * @returns Path without extension
 */
function withoutExt(path: string) {
  return join(dirname(path), basename(path, extname(path)))
}

export function getRawQuerystring(req: FastifyRequest) {
  const url = new URL(req.raw.url || '', 'http://localhost')
  return url.search
}

export function isNonNegativeInteger(value: string): boolean {
  return /^\d+$/.test(value)
}
