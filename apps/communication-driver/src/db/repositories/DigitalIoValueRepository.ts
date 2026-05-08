import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate } from '../../utils'
import {
  DIGITAL_IO_VALUE_COLUMNS,
  DIGITAL_IO_VALUE_TABLE,
  type DigitalIoValue,
  type DigitalIoValueInsert,
  type DigitalIoValueRaw,
} from '../models'

export function booleanArrayToHex(arr: boolean[]): string {
  const padded = [...arr]
  while (padded.length % 4 !== 0) padded.push(false)
  let result = ''
  for (let i = 0; i < padded.length; i += 4) {
    const nibble
      = (Number(padded[i]) << 3)
      | (Number(padded[i + 1]) << 2)
      | (Number(padded[i + 2]) << 1)
      | Number(padded[i + 3])
    result += nibble.toString(16).toUpperCase()
  }
  return result
}

export function hexToBooleanArray(hex: string): boolean[] {
  const result: boolean[] = []
  for (const char of hex) {
    const nibble = Number.parseInt(char, 16)
    result.push((nibble & 8) !== 0)
    result.push((nibble & 4) !== 0)
    result.push((nibble & 2) !== 0)
    result.push((nibble & 1) !== 0)
  }
  return result
}

export interface DigitalIoValueRepository {
  findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<DigitalIoValue[]>
  insert(data: DigitalIoValueInsert, trx?: Knex.Transaction): Promise<void>
  deleteByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<void>
}

export class KnexDigitalIoValueRepository implements DigitalIoValueRepository {
  private readonly db: Knex
  private readonly tzOffset: number

  constructor({
    teleskop,
    teleskopTimezoneOffset,
  }: {
    teleskop: Knex
    teleskopTimezoneOffset: number
  }) {
    this.db = teleskop
    this.tzOffset = teleskopTimezoneOffset
  }

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx ? trx(DIGITAL_IO_VALUE_TABLE) : this.db(DIGITAL_IO_VALUE_TABLE)
  }

  async findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<DigitalIoValue[]> {
    const rows = await this.qb(trx)
      .select(DIGITAL_IO_VALUE_COLUMNS)
      .where('BATCHKEY', batchKey)
      .orderBy('LOGTIME', 'asc') as DigitalIoValueRaw[]

    return rows.map(row => ({
      ...row,
      logTime: adjustFromDbDate(row.logTime, this.tzOffset),
      doFuncValues: row.doFuncValues != null ? hexToBooleanArray(row.doFuncValues) : null,
      doLockValues: row.doLockValues != null ? hexToBooleanArray(row.doLockValues) : null,
      diValues: row.diValues != null ? hexToBooleanArray(row.diValues) : null,
    }))
  }

  async insert(data: DigitalIoValueInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      BATCHKEY: data.batchKey,
      LOGTIME: adjustToDbDate(data.logTime ?? new Date(), this.tzOffset),
      DOFuncValues: data.doFuncValues != null ? booleanArrayToHex(data.doFuncValues) : null,
      DOLockValues: data.doLockValues != null ? booleanArrayToHex(data.doLockValues) : null,
      DIValues: data.diValues != null ? booleanArrayToHex(data.diValues) : null,
    } satisfies TableRecord<typeof DIGITAL_IO_VALUE_COLUMNS>)
  }

  async deleteByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).where('BATCHKEY', batchKey).delete()
  }
}
