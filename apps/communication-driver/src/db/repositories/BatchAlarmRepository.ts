import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate } from '../../utils'
import {
  BATCH_ALARM_COLUMNS,
  BATCH_ALARM_TABLE,
  type BatchAlarm,
  type BatchAlarmInsert,
} from '../models'

export interface BatchAlarmRepository {
  findByKey(
    batchKey: number,
    batchAlarmNo: number,
    trx?: Knex.Transaction,
  ): Promise<BatchAlarm | undefined>
  findOpenAlarms(batchKey: number, trx?: Knex.Transaction): Promise<BatchAlarm[]>
  insert(data: BatchAlarmInsert, trx?: Knex.Transaction): Promise<void>
  setConfirmTime(
    batchKey: number,
    batchAlarmNo: number,
    confirmTime: Date,
    trx?: Knex.Transaction,
  ): Promise<void>
  setEndTime(
    batchKey: number,
    batchAlarmNo: number,
    endTime: Date,
    trx?: Knex.Transaction,
  ): Promise<void>
  closeAllOpen(batchKey: number, endTime: Date, trx?: Knex.Transaction): Promise<void>
}

export class KnexBatchAlarmRepository implements BatchAlarmRepository {
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
    return trx ? trx(BATCH_ALARM_TABLE) : this.db(BATCH_ALARM_TABLE)
  }

  private deserialize(row: any): BatchAlarm {
    return {
      ...row,
      startTime: adjustFromDbDate(row.startTime, this.tzOffset),
      confirmTime: adjustFromDbDate(row.confirmTime, this.tzOffset),
      endTime: adjustFromDbDate(row.endTime, this.tzOffset),
    }
  }

  async findByKey(
    batchKey: number,
    batchAlarmNo: number,
    trx?: Knex.Transaction,
  ): Promise<BatchAlarm | undefined> {
    const row = await this.qb(trx)
      .column(BATCH_ALARM_COLUMNS)
      .where({ BATCHKEY: batchKey, BATCHALARMNO: batchAlarmNo })
      .first()
    return row ? this.deserialize(row) : undefined
  }

  async findOpenAlarms(batchKey: number, trx?: Knex.Transaction): Promise<BatchAlarm[]> {
    const rows = await this.qb(trx)
      .column(BATCH_ALARM_COLUMNS)
      .where({ BATCHKEY: batchKey })
      .whereNull('ENDTIME')
    return rows.map((row: any) => this.deserialize(row))
  }

  async insert(data: BatchAlarmInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      BATCHKEY: data.batchKey,
      BATCHALARMNO: data.batchAlarmNo,
      ALARMNO: data.alarmNo,
      PROGNO: data.programNo,
      COMMANDNO: data.commandNo,
      STARTTIME: adjustToDbDate(data.startTime, this.tzOffset),
      ALARMTYPE: data.alarmType,
      ISPARALLEL: data.isParallel,
      EXPLANATION: data.explanation,
      PRGINDEX: data.programIndex ?? -1,
      PHASENO: data.phaseNo ?? -1,
      PHASEINDEX: data.phaseIndex ?? -1,
    } satisfies TableRecord<typeof BATCH_ALARM_COLUMNS>)
  }

  async setConfirmTime(
    batchKey: number,
    batchAlarmNo: number,
    confirmTime: Date,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.qb(trx)
      .where({ BATCHKEY: batchKey, BATCHALARMNO: batchAlarmNo })
      .update({
        CONFIRMTIME: adjustToDbDate(confirmTime, this.tzOffset),
      } satisfies TableRecord<typeof BATCH_ALARM_COLUMNS>)
  }

  async setEndTime(
    batchKey: number,
    batchAlarmNo: number,
    endTime: Date,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.qb(trx)
      .where({ BATCHKEY: batchKey, BATCHALARMNO: batchAlarmNo })
      .update({
        ENDTIME: adjustToDbDate(endTime, this.tzOffset),
      } satisfies TableRecord<typeof BATCH_ALARM_COLUMNS>)
  }

  /** Closes all open alarms for a batch (used on batch end / cancel). */
  async closeAllOpen(batchKey: number, endTime: Date, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ BATCHKEY: batchKey })
      .whereNull('ENDTIME')
      .update({
        ENDTIME: adjustToDbDate(endTime, this.tzOffset),
      } satisfies TableRecord<typeof BATCH_ALARM_COLUMNS>)
  }
}
