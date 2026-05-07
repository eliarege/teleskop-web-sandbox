import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate } from '../../utils'
import { MACHINE_COLUMNS, MACHINE_TABLE, type Machine, type MachineUpdate } from '../models'

export interface MachineRepository {
  findById(machineId: number, trx?: Knex.Transaction): Promise<Machine | undefined>
  findAll(trx?: Knex.Transaction): Promise<Machine[]>
  /** Returns all machines where `inUse = true`, `useInTeleskop = true`, and `tbbModel = 'Tonello'`. */
  findActiveTonello(trx?: Knex.Transaction): Promise<Machine[]>
  update(machineId: number, data: MachineUpdate, trx?: Knex.Transaction): Promise<void>
  setBatchDownloadStatus(
    machineId: number,
    batchNo: string,
    status: number,
    trx?: Knex.Transaction,
  ): Promise<void>
  setLastEventProcessed(
    machineId: number,
    eventId: number,
    eventDate: Date,
    trx?: Knex.Transaction,
  ): Promise<void>
}

export class KnexMachineRepository implements MachineRepository {
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
    return trx ? trx(MACHINE_TABLE) : this.db(MACHINE_TABLE)
  }

  private deserialize(row: any): Machine {
    return {
      ...row,
      lastEventProcessDate: adjustFromDbDate(row.lastEventProcessDate, this.tzOffset),
      batchDownloadStatusChangeTime: adjustFromDbDate(
        row.batchDownloadStatusChangeTime,
        this.tzOffset,
      ),
    }
  }

  async findById(machineId: number, trx?: Knex.Transaction): Promise<Machine | undefined> {
    const row = await this.qb(trx).column(MACHINE_COLUMNS).where({ MACHINEID: machineId }).first()
    return row ? this.deserialize(row) : undefined
  }

  async findAll(trx?: Knex.Transaction): Promise<Machine[]> {
    const rows = await this.qb(trx).column(MACHINE_COLUMNS).where({ INUSE: true })
    return rows.map((row: any) => this.deserialize(row))
  }

  async findActiveTonello(trx?: Knex.Transaction): Promise<Machine[]> {
    const rows = await this.qb(trx)
      .column(MACHINE_COLUMNS)
      .where({ INUSE: true, USEINTELESKOP: true, TBBMODEL: 'Tonello' })
    return rows.map((row: any) => this.deserialize(row))
  }

  async update(machineId: number, data: MachineUpdate, trx?: Knex.Transaction): Promise<void> {
    const columnMap = MACHINE_COLUMNS as Record<string, string>
    const row: Record<string, unknown> = {}
    for (const [camelKey, dbCol] of Object.entries(columnMap)) {
      if (camelKey in data) {
        const value = data[camelKey as keyof MachineUpdate]
        row[dbCol] = value instanceof Date ? adjustToDbDate(value, this.tzOffset) : value
      }
    }
    if (Object.keys(row).length === 0)
      return
    await this.qb(trx).where({ MACHINEID: machineId }).update(row)
  }

  async setBatchDownloadStatus(
    machineId: number,
    batchNo: string,
    status: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.qb(trx)
      .where({ MACHINEID: machineId })
      .update({
        BATCHNO: batchNo,
        BATCHDOWNLOADSTATUS: status,
        BATCHDOWNLOADSTATUSCHANGETIME: adjustToDbDate(new Date(), this.tzOffset),
      } satisfies TableRecord<typeof MACHINE_COLUMNS>)
  }

  async setLastEventProcessed(
    machineId: number,
    eventId: number,
    eventDate: Date,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.qb(trx)
      .where({ MACHINEID: machineId })
      .update({
        LASTEVENTPROCESSID: eventId,
        LASTEVENTPROCESSDATE: adjustToDbDate(eventDate, this.tzOffset),
      } satisfies TableRecord<typeof MACHINE_COLUMNS>)
  }
}
