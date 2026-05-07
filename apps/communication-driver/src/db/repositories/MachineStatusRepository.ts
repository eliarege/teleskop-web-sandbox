import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate, extractDateString, joinNumberList, splitNumberList } from '../../utils'
import {
  MACHINE_STATUS_COLUMNS,
  MACHINE_STATUS_TABLE,
  type MachineStatus,
  type MachineStatusUpdate,
} from '../models'

export interface MachineStatusRepository {
  findByMachineId(machineId: number, trx?: Knex.Transaction): Promise<MachineStatus | undefined>
  /** Creates a status row for the machine if one does not already exist. */
  ensureExists(machineId: number, trx?: Knex.Transaction): Promise<void>
  update(machineId: number, data: MachineStatusUpdate, trx?: Knex.Transaction): Promise<void>
  setRunningBatch(
    machineId: number,
    batchKey: number,
    jobOrder: string,
    startTime: Date,
    trx?: Knex.Transaction,
  ): Promise<void>
  clearRunningBatch(machineId: number, trx?: Knex.Transaction): Promise<void>
  setRunningCommand(
    machineId: number,
    programId: number,
    programName: string,
    stepNo: number,
    commandNo: number,
    commandName: string,
    trx?: Knex.Transaction,
  ): Promise<void>
  setBatchLoaded(machineId: number, loaded: boolean, trx?: Knex.Transaction): Promise<void>
}

export class KnexMachineStatusRepository implements MachineStatusRepository {
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
    return trx ? trx(MACHINE_STATUS_TABLE) : this.db(MACHINE_STATUS_TABLE)
  }

  private deserialize(row: any): MachineStatus {
    return {
      ...row,
      runningProgramNoList: row.runningProgramNoList != null ? splitNumberList(row.runningProgramNoList) : null,
      updateTime: adjustFromDbDate(row.updateTime, this.tzOffset),
      lastReferenceDate: adjustFromDbDate(row.lastReferenceDate, this.tzOffset),
      runningJobOrderStartTime: adjustFromDbDate(row.runningJobOrderStartTime, this.tzOffset),
      stopReasonDateTime: adjustFromDbDate(row.stopReasonDateTime, this.tzOffset),
      lastPingFail: adjustFromDbDate(row.lastPingFail, this.tzOffset),
      lastSoapFail: adjustFromDbDate(row.lastSoapFail, this.tzOffset),
      consumptionReadDate: adjustFromDbDate(row.consumptionReadDate, this.tzOffset),
      steamReadDate: adjustFromDbDate(row.steamReadDate, this.tzOffset),
      manualReasonDateTime: adjustFromDbDate(row.manualReasonDateTime, this.tzOffset),
      // Knex converts `date` columns to Date objects, but we want to keep it as a string in `yyyy-MM-dd` format
      lastEventDate: row.lastEventDate != null ? extractDateString(row.lastEventDate) : null,
    }
  }

  async findByMachineId(
    machineId: number,
    trx?: Knex.Transaction,
  ): Promise<MachineStatus | undefined> {
    const row = await this.qb(trx)
      .column(MACHINE_STATUS_COLUMNS)
      .where({ MACHINEID: machineId })
      .first()
    if (!row)
      return undefined
    return this.deserialize(row)
  }

  async ensureExists(machineId: number, trx?: Knex.Transaction): Promise<void> {
    const existing = await this.findByMachineId(machineId, trx)
    if (!existing) {
      await this.qb(trx).insert({
        MACHINEID: machineId,
        MANUELCOMMANDACTIVE: false,
        RUNNINGBATCHDELAY: 0,
      } satisfies TableRecord<typeof MACHINE_STATUS_COLUMNS>)
    }
  }

  async update(
    machineId: number,
    data: MachineStatusUpdate,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const columnMap = MACHINE_STATUS_COLUMNS as Record<string, string>
    const row: Record<string, unknown> = {}
    for (const [camelKey, dbCol] of Object.entries(columnMap)) {
      if (camelKey in data) {
        const value = data[camelKey as keyof MachineStatusUpdate]
        if (camelKey === 'runningProgramNoList') {
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
    row.UPDATETIME = adjustToDbDate(new Date(), this.tzOffset)
    await this.qb(trx).where({ MACHINEID: machineId }).update(row)
  }

  async setRunningBatch(
    machineId: number,
    batchKey: number,
    jobOrder: string,
    startTime: Date,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.qb(trx)
      .where({ MACHINEID: machineId })
      .update({
        RUNNING_BATCHKEY: batchKey,
        RUNNING_JOBORDER: jobOrder,
        RUNNING_JOBORDERSTARTTIME: adjustToDbDate(startTime, this.tzOffset),
        UPDATETIME: adjustToDbDate(new Date(), this.tzOffset),
      } satisfies TableRecord<typeof MACHINE_STATUS_COLUMNS>)
  }

  async clearRunningBatch(machineId: number, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ MACHINEID: machineId })
      .update({
        RUNNING_BATCHKEY: null,
        RUNNING_JOBORDER: null,
        RUNNING_JOBORDERSTARTTIME: null,
        RUNNING_BATCHSTATUS: null,
        RUNNING_PROGRAMID: null,
        RUNNING_PROGRAMNAME: null,
        RUNNING_STEPNO: null,
        RUNNING_CMDNO: null,
        RUNNING_CMDNAME: null,
        UPDATETIME: adjustToDbDate(new Date(), this.tzOffset),
      } satisfies TableRecord<typeof MACHINE_STATUS_COLUMNS>)
  }

  async setRunningCommand(
    machineId: number,
    programId: number,
    programName: string,
    stepNo: number,
    commandNo: number,
    commandName: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.qb(trx)
      .where({ MACHINEID: machineId })
      .update({
        RUNNING_PROGRAMID: programId,
        RUNNING_PROGRAMNAME: programName,
        RUNNING_STEPNO: stepNo,
        RUNNING_CMDNO: commandNo,
        RUNNING_CMDNAME: commandName,
        UPDATETIME: adjustToDbDate(new Date(), this.tzOffset),
      } satisfies TableRecord<typeof MACHINE_STATUS_COLUMNS>)
  }

  async setBatchLoaded(machineId: number, loaded: boolean, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ MACHINEID: machineId })
      .update({
        BATCHLOADED: loaded,
        UPDATETIME: adjustToDbDate(new Date(), this.tzOffset),
      } satisfies TableRecord<typeof MACHINE_STATUS_COLUMNS>)
  }
}
