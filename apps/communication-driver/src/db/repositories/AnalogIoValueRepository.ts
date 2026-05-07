import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate } from '../../utils'
import {
  ANALOG_IO_VALUE_COLUMNS,
  ANALOG_IO_VALUE_TABLE,
  type AnalogIoValue,
  type AnalogIoValueInsert,
} from '../models'

export interface AnalogIoValueRepository {
  findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<AnalogIoValue[]>
  insert(data: AnalogIoValueInsert, trx?: Knex.Transaction): Promise<void>
  deleteByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<void>
}

export class KnexAnalogIoValueRepository implements AnalogIoValueRepository {
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
    return trx ? trx(ANALOG_IO_VALUE_TABLE) : this.db(ANALOG_IO_VALUE_TABLE)
  }

  async findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<AnalogIoValue[]> {
    const rows = await this.qb(trx)
      .column(ANALOG_IO_VALUE_COLUMNS)
      .where({ BATCHKEY: batchKey })
      .orderBy([
        { column: 'IOTYPE', order: 'asc' },
        { column: 'IOINDEX', order: 'asc' },
        { column: 'LOGTIME', order: 'asc' },
      ]) as AnalogIoValue[]

    return rows.map(row => ({
      ...row,
      logTime: adjustFromDbDate(row.logTime, this.tzOffset),
    }))
  }

  async insert(data: AnalogIoValueInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      MACHINEID: data.machineId,
      BATCHKEY: data.batchKey,
      LOGTIME: adjustToDbDate(data.logTime ?? new Date(), this.tzOffset),
      IOTYPE: data.ioType,
      IOINDEX: data.ioIndex,
      IOVALUE: data.ioValue,
      SOURCE: data.source,
    } satisfies TableRecord<typeof ANALOG_IO_VALUE_COLUMNS>)
  }

  async deleteByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).where('BATCHKEY', batchKey).delete()
  }
}
