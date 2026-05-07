import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate } from '../../utils'
import {
  BATCH_STOP_COLUMNS,
  BATCH_STOP_TABLE,
  type BatchStop,
  type BatchStopInsert,
} from '../models'

export interface BatchStopRepository {
  findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<BatchStop[]>
  findLatestOpen(batchKey: number, trx?: Knex.Transaction): Promise<BatchStop | undefined>
  insert(data: BatchStopInsert, trx?: Knex.Transaction): Promise<void>
  closeLatestOpen(batchKey: number, endTime: Date, trx?: Knex.Transaction): Promise<void>
  /** Closes the latest open stop for a machine regardless of batchKey. Used when resuming from startup. */
  closeLatestOpenForMachine(machineId: number, endTime: Date, trx?: Knex.Transaction): Promise<void>
  setStopReason(stopNumber: number, stopReason: number, trx?: Knex.Transaction): Promise<void>
}

export class KnexBatchStopRepository implements BatchStopRepository {
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
    return trx ? trx(BATCH_STOP_TABLE) : this.db(BATCH_STOP_TABLE)
  }

  private deserialize(row: any): BatchStop {
    return {
      ...row,
      startTime: adjustFromDbDate(row.startTime, this.tzOffset),
      endTime: adjustFromDbDate(row.endTime, this.tzOffset),
    }
  }

  async findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<BatchStop[]> {
    const rows = await this.qb(trx).column(BATCH_STOP_COLUMNS).where({ BATCHKEY: batchKey })
    return rows.map((row: any) => this.deserialize(row))
  }

  /** Returns the latest open stop (no end time) for a batch. */
  async findLatestOpen(batchKey: number, trx?: Knex.Transaction): Promise<BatchStop | undefined> {
    const row = await this.qb(trx)
      .column(BATCH_STOP_COLUMNS)
      .where({ BATCHKEY: batchKey })
      .whereNull('ENDTIME')
      .orderBy('STOPNUMBER', 'desc')
      .first()
    return row ? this.deserialize(row) : undefined
  }

  async insert(data: BatchStopInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      MACHINEID: data.machineId,
      BATCHKEY: data.batchKey,
      STOPREASON: data.stopReason,
      STARTTIME: adjustToDbDate(data.startTime, this.tzOffset),
      EXPLANATION: data.explanation,
    } satisfies TableRecord<typeof BATCH_STOP_COLUMNS>)
  }

  async closeLatestOpen(batchKey: number, endTime: Date, trx?: Knex.Transaction): Promise<void> {
    const openStop = await this.findLatestOpen(batchKey, trx)
    if (!openStop)
      return
    await this.qb(trx)
      .where({ STOPNUMBER: openStop.stopNumber })
      .update({
        ENDTIME: adjustToDbDate(endTime, this.tzOffset),
      } satisfies TableRecord<typeof BATCH_STOP_COLUMNS>)
  }

  async closeLatestOpenForMachine(
    machineId: number,
    endTime: Date,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const openStop = (await this.qb(trx)
      .column(BATCH_STOP_COLUMNS)
      .where({ MACHINEID: machineId })
      .whereNull('ENDTIME')
      .orderBy('STOPNUMBER', 'desc')
      .first()) as BatchStop | undefined
    if (!openStop)
      return
    await this.qb(trx)
      .where({ STOPNUMBER: openStop.stopNumber })
      .update({
        ENDTIME: adjustToDbDate(endTime, this.tzOffset),
      } satisfies TableRecord<typeof BATCH_STOP_COLUMNS>)
  }

  async setStopReason(
    stopNumber: number,
    stopReason: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.qb(trx).where({ STOPNUMBER: stopNumber }).update({
      STOPREASON: stopReason,
    } satisfies TableRecord<typeof BATCH_STOP_COLUMNS>)
  }
}
