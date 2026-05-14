import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate } from '../../utils'
import {
  BATCH_STEP_COLUMNS,
  BATCH_STEP_TABLE,
  type BatchStep,
  type BatchStepInsert,
} from '../models'

export interface BatchStepKey {
  batchKey: number
  programNo: number
  stepNo: number
  parallelStepNo: number
  commandNo: number
}

export interface BatchStepRepository {
  findByKey(
    key: BatchStepKey,
    trx?: Knex.Transaction,
  ): Promise<BatchStep | undefined>
  findOpenSteps(batchKey: number, trx?: Knex.Transaction): Promise<BatchStep[]>
  insert(data: BatchStepInsert, trx?: Knex.Transaction): Promise<void>
  setEndTime(
    key: BatchStepKey,
    endTime: Date,
    trx?: Knex.Transaction,
  ): Promise<void>
  closeAllOpen(batchKey: number, endTime: Date, trx?: Knex.Transaction): Promise<void>
}

export class KnexBatchStepRepository implements BatchStepRepository {
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
    return trx ? trx(BATCH_STEP_TABLE) : this.db(BATCH_STEP_TABLE)
  }

  private deserialize(row: any): BatchStep {
    return {
      ...row,
      startTime: adjustFromDbDate(row.startTime, this.tzOffset),
      endTime: adjustFromDbDate(row.endTime, this.tzOffset),
    }
  }

  async findByKey(
    key: BatchStepKey,
    trx?: Knex.Transaction,
  ): Promise<BatchStep | undefined> {
    const row = await this.qb(trx)
      .column(BATCH_STEP_COLUMNS)
      .where({
        BATCHKEY: key.batchKey,
        PRGNO: key.programNo,
        STEPNO: key.stepNo,
        PARALLELSTEPNO: key.parallelStepNo,
        COMMANDNO: key.commandNo,
      })
      .first()
    return row ? this.deserialize(row) : undefined
  }

  async findOpenSteps(batchKey: number, trx?: Knex.Transaction): Promise<BatchStep[]> {
    const rows = await this.qb(trx)
      .column(BATCH_STEP_COLUMNS)
      .where({ BATCHKEY: batchKey })
      .whereNull('ENDTIME')
    return rows.map((row: any) => this.deserialize(row))
  }

  async insert(data: BatchStepInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      BATCHKEY: data.batchKey,
      PRGNO: data.programNo,
      STEPNO: data.stepNo,
      PARALLELSTEPNO: data.parallelStepNo,
      COMMANDNO: data.commandNo,
      STARTTIME: adjustToDbDate(data.startTime, this.tzOffset),
      THEORETICDURATION: data.theoreticalDuration,
      PRGINDEX: data.programIndex ?? -1,
      PHASENO: data.phaseNo,
      PHASEINDEX: data.phaseIndex,
      OPTIMIZEDTHEORETICDURATION: data.optimizedTheoreticalDuration,
    } satisfies TableRecord<typeof BATCH_STEP_COLUMNS>)
  }

  async setEndTime(
    key: BatchStepKey,
    endTime: Date,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.qb(trx)
      .where({
        BATCHKEY: key.batchKey,
        PRGNO: key.programNo,
        STEPNO: key.stepNo,
        PARALLELSTEPNO: key.parallelStepNo,
        COMMANDNO: key.commandNo,
      })
      // There maybe multiple rows matching the key
      .whereNull('ENDTIME')
      .update({
        ENDTIME: adjustToDbDate(endTime, this.tzOffset),
      } satisfies TableRecord<typeof BATCH_STEP_COLUMNS>)
  }

  /** Closes all open steps for a batch (used on batch end / cancel). */
  async closeAllOpen(batchKey: number, endTime: Date, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ BATCHKEY: batchKey })
      .whereNull('ENDTIME')
      .update({
        ENDTIME: adjustToDbDate(endTime, this.tzOffset),
      } satisfies TableRecord<typeof BATCH_STEP_COLUMNS>)
  }
}
