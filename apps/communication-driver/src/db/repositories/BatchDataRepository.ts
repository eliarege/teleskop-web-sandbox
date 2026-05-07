import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate, extractDateString, joinNumberList, splitNumberList } from '../../utils'
import {
  BATCH_DATA_COLUMNS,
  BATCH_DATA_TABLE,
  type BatchData,
  type BatchDataInsert,
  type BatchDataUpdate,
} from '../models'

export interface BatchDataRepository {
  findByKey(batchKey: number, trx?: Knex.Transaction): Promise<BatchData | undefined>
  findOpenByMachineId(machineId: number, trx?: Knex.Transaction): Promise<BatchData | undefined>
  insert(data: BatchDataInsert, trx?: Knex.Transaction): Promise<void>
  /** Inserts a batch and returns the generated `batchKey`. */
  insertAndReturn(data: BatchDataInsert, trx?: Knex.Transaction): Promise<BatchData>
  update(batchKey: number, data: BatchDataUpdate, trx?: Knex.Transaction): Promise<void>
  setEndTime(batchKey: number, endTime: Date, trx?: Knex.Transaction): Promise<void>
  setCancelTime(batchKey: number, cancelTime: Date, trx?: Knex.Transaction): Promise<void>
  setFinishReasonId(batchKey: number, finishReasonId: number, trx?: Knex.Transaction): Promise<void>
  markAdditionStarted(batchKey: number, trx?: Knex.Transaction): Promise<void>
  getNextBatchReference(date: Date, machineId: number, trx?: Knex.Transaction): Promise<string>
}

export class KnexBatchDataRepository implements BatchDataRepository {
  private readonly db: Knex
  private readonly tzOffset: number
  private readonly reverseMapping: Map<string, string>

  constructor({
    teleskop,
    teleskopTimezoneOffset,
  }: {
    teleskop: Knex
    teleskopTimezoneOffset: number
  }) {
    this.db = teleskop
    this.tzOffset = teleskopTimezoneOffset
    this.reverseMapping = new Map(Object.entries(BATCH_DATA_COLUMNS).map(([key, value]) => [value, key]))
  }

  private get table() {
    return this.db(BATCH_DATA_TABLE)
  }

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx ? trx(BATCH_DATA_TABLE) : this.table
  }

  private deserialize(row: any): BatchData {
    return {
      ...row,
      programNoList: row.programNoList != null ? splitNumberList(row.programNoList) : null,
      startTime: adjustFromDbDate(row.startTime, this.tzOffset),
      endTime: adjustFromDbDate(row.endTime, this.tzOffset),
      cancelTime: adjustFromDbDate(row.cancelTime, this.tzOffset),
      endConfirmTime: adjustFromDbDate(row.endConfirmTime, this.tzOffset),
    }
  }

  async findByKey(batchKey: number, trx?: Knex.Transaction): Promise<BatchData | undefined> {
    const row = await this.qb(trx).column(BATCH_DATA_COLUMNS).where({ BATCHKEY: batchKey }).first()
    return row ? this.deserialize(row) : undefined
  }

  /** Returns the currently open (not ended/cancelled) batch for a machine. */
  async findOpenByMachineId(
    machineId: number,
    trx?: Knex.Transaction,
  ): Promise<BatchData | undefined> {
    const row = await this.qb(trx)
      .column(BATCH_DATA_COLUMNS)
      .where({ MACHINEID: machineId })
      .whereNull('ENDTIME')
      .whereNull('CANCELTIME')
      .first()
    return row ? this.deserialize(row) : undefined
  }

  async insert(data: BatchDataInsert, trx?: Knex.Transaction): Promise<void> {
    const nextBatchKey = await this.getNextBatchKey(trx)
    await this.qb(trx).insert({
      BATCHKEY: nextBatchKey,
      BATCHREFERENCE: data.batchReference,
      MACHINEID: data.machineId,
      MACHINECODE: data.machineCode,
      JOBORDER: data.jobOrder,
      STARTTIME: adjustToDbDate(data.startTime, this.tzOffset),
      PRGCOUNT: data.programCount,
      ISCORRECTION: data.isCorrection,
      ARCHIVED: data.archived,
      CANCELDETAIL: data.cancelDetail ?? 1,
      theoricElectricity: data.theoricElectricity ?? false,
      theoricWater: data.theoricWater ?? false,
      theoricSteam: data.theoricSteam ?? true,
      RECIPETYPEID: data.recipeTypeId ?? 1,
      ADDITIONSTARTED: data.additionStarted ?? false,
      PROGRAMNOLIST: joinNumberList(data.programNoList),
      STOPREASON: data.stopReason,
      CORRECTIONCOUNT: data.correctionCount,
      CORRECTIONREASON: data.correctionReason,
      OPRCODE: data.operatorCode,
      OPRNAME: data.operatorName,
      CLIENTCODE: data.clientCode,
      THEORETICDURAT: data.theoreticalDuration,
      FABRIC_WEIGHT: data.fabricWeight,
      Color: data.color,
      startedWithPrcss: data.startedWithProcess,
      prcssId: data.processId,
      PLANKEY: data.planKey,
      CUSTOMERNAME: data.customerName,
      PARTYNUMBER: data.partyNumber,
      PLANNEDMACHINEID: data.plannedMachineId,
      STYLE: data.style,
      ITEM: data.item,
      COLORNAME: data.colorName,
    } satisfies TableRecord<typeof BATCH_DATA_COLUMNS>)
  }

  async insertAndReturn(data: BatchDataInsert, trx?: Knex.Transaction): Promise<BatchData> {
    const nextBatchKey = await this.getNextBatchKey(trx)
    const [row] = (await this.qb(trx)
      .insert({
        BATCHKEY: nextBatchKey,
        BATCHREFERENCE: data.batchReference,
        MACHINEID: data.machineId,
        MACHINECODE: data.machineCode,
        JOBORDER: data.jobOrder,
        STARTTIME: adjustToDbDate(data.startTime, this.tzOffset),
        PRGCOUNT: data.programCount,
        ISCORRECTION: data.isCorrection,
        ARCHIVED: data.archived,
        CANCELDETAIL: data.cancelDetail ?? 1,
        theoricElectricity: data.theoricElectricity ?? false,
        theoricWater: data.theoricWater ?? false,
        theoricSteam: data.theoricSteam ?? true,
        RECIPETYPEID: data.recipeTypeId ?? 1,
        ADDITIONSTARTED: data.additionStarted ?? false,
        PROGRAMNOLIST: joinNumberList(data.programNoList),
        STOPREASON: data.stopReason,
        CORRECTIONCOUNT: data.correctionCount,
        CORRECTIONREASON: data.correctionReason,
        OPRCODE: data.operatorCode,
        OPRNAME: data.operatorName,
        CLIENTCODE: data.clientCode,
        THEORETICDURAT: data.theoreticalDuration,
        FABRIC_WEIGHT: data.fabricWeight,
        Color: data.color,
        startedWithPrcss: data.startedWithProcess,
        prcssId: data.processId,
        PLANKEY: data.planKey,
        CUSTOMERNAME: data.customerName,
        PARTYNUMBER: data.partyNumber,
        PLANNEDMACHINEID: data.plannedMachineId,
        STYLE: data.style,
        ITEM: data.item,
        COLORNAME: data.colorName,
      } satisfies TableRecord<typeof BATCH_DATA_COLUMNS>)
      .returning('*')) as Array<Record<string, unknown>>

    const mapped = {} as Record<string, unknown>
    for (const [dbCol, value] of Object.entries(row)) {
      const camelKey = this.reverseMapping.get(dbCol) ?? dbCol
      mapped[camelKey] = value
    }
    return this.deserialize(mapped)
  }

  async update(batchKey: number, data: BatchDataUpdate, trx?: Knex.Transaction): Promise<void> {
    const columnMap = BATCH_DATA_COLUMNS as Record<string, string>
    const row: Record<string, unknown> = {}
    for (const [camelKey, dbCol] of Object.entries(columnMap)) {
      if (camelKey in data && camelKey !== 'batchKey') {
        const value = data[camelKey as keyof BatchDataUpdate]
        if (camelKey === 'programNoList') {
          row[dbCol] = joinNumberList(value as number[] | null | undefined)
        } else if (value instanceof Date) {
          row[dbCol] = adjustToDbDate(value, this.tzOffset)
        } else {
          row[dbCol] = value
        }
      }
    }
    if (Object.keys(row).length === 0)
      return
    await this.qb(trx).where({ BATCHKEY: batchKey }).update(row)
  }

  async setEndTime(batchKey: number, endTime: Date, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ BATCHKEY: batchKey })
      .update({
        ENDTIME: adjustToDbDate(endTime, this.tzOffset),
      } satisfies TableRecord<typeof BATCH_DATA_COLUMNS>)
  }

  async setCancelTime(batchKey: number, cancelTime: Date, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ BATCHKEY: batchKey })
      .update({
        CANCELTIME: adjustToDbDate(cancelTime, this.tzOffset),
      } satisfies TableRecord<typeof BATCH_DATA_COLUMNS>)
  }

  async setFinishReasonId(
    batchKey: number,
    finishReasonId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.qb(trx).where({ BATCHKEY: batchKey }).update({
      FINISHREASONID: finishReasonId,
    } satisfies TableRecord<typeof BATCH_DATA_COLUMNS>)
  }

  async markAdditionStarted(batchKey: number, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).where({ BATCHKEY: batchKey }).update({
      ADDITIONSTARTED: true,
    } satisfies TableRecord<typeof BATCH_DATA_COLUMNS>)
  }

  private getNextBatchKey(trx?: Knex.Transaction): Promise<number> {
    return this.qb(trx)
      .from(BATCH_DATA_TABLE)
      .max('BATCHKEY as maxKey')
      .first()
      .then(row => (row?.maxKey ?? 0) + 1)
  }

  async getNextBatchReference(date: Date, machineId: number, trx?: Knex.Transaction): Promise<string> {
    const datePart = extractDateString(date).split('-').join('.')
    const likePattern = `${datePart}.${machineId}.%`
    const row = await this.qb(trx)
      .from(BATCH_DATA_TABLE)
      .whereLike('BATCHREFERENCE', likePattern)
      .orderBy('BATCHREFERENCE', 'desc')
      .first('BATCHREFERENCE as maxRef') as { maxRef?: string } | undefined

    if (!row?.maxRef) {
      return `${datePart}.${machineId}.1`
    }

    const parts = row.maxRef.split('.')
    const seqNum = Number.parseInt(parts[parts.length - 1], 10) || 0
    return `${datePart}.${machineId}.${seqNum + 1}`
  }
}
