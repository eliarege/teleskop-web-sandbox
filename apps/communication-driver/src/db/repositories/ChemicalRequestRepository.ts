import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate, tryJsonParse } from '../../utils'
import {
  CHEMICAL_REQUEST_COLUMNS,
  CHEMICAL_REQUEST_TABLE,
  type ChemicalRequest,
  type ChemicalRequestInsert,
} from '../models'
import { RequestStatus } from '../enums'
import { TonelloChemicalRequestEvent } from '@teleskop/core'

export interface ChemicalRequestRepository {
  findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequest[]>
  insert(data: ChemicalRequestInsert, trx?: Knex.Transaction): Promise<number>
  updateStatus(id: number, status: RequestStatus, trx?: Knex.Transaction): Promise<void>
}

export class KnexChemicalRequestRepository implements ChemicalRequestRepository {
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
    return trx ? trx(CHEMICAL_REQUEST_TABLE) : this.db(CHEMICAL_REQUEST_TABLE)
  }

  private deserialize(row: any): ChemicalRequest {
    const tonelloEvent = tryJsonParse<TonelloChemicalRequestEvent>(row.tonelloEvent)
    if (tonelloEvent) {
      tonelloEvent.datetime = new Date(tonelloEvent.datetime)
    }
    return {
      ...row,
      requestTime: adjustFromDbDate(row.requestTime, this.tzOffset),
      tonelloEvent,
    }
  }

  async findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequest[]> {
    const rows = await this.qb(trx).column(CHEMICAL_REQUEST_COLUMNS).where({ BATCHKEY: batchKey })
    return rows.map((row: any) => this.deserialize(row))
  }

  async insert(data: ChemicalRequestInsert, trx?: Knex.Transaction): Promise<number> {
    const [row] = (await this.qb(trx).insert({
      BATCHKEY: data.batchKey,
      REQUESTTIME: adjustToDbDate(data.requestTime, this.tzOffset),
      JobOrder: data.jobOrder,
      RECEIPEINDEX: data.recipeIndex,
      RequestOrderIndex: data.requestOrderIndex,
      OPERATIONCode: data.operationCode,
      TargetRECIPE: data.targetRecipe,
      TankNo: data.tankNo,
      PRIORITY: data.priority,
      TotalNumberOfRequest: data.totalRequests,
      ProgramNo: data.programNo,
      COMMANDNO: data.commandNo,
      STATUS: data.status ?? null,
      TonelloEvent: data.tonelloEvent ? JSON.stringify(data.tonelloEvent) : null,
    } satisfies TableRecord<typeof CHEMICAL_REQUEST_COLUMNS>)
      .returning('AUTOID')) as Array<{ AUTOID: number }>
    return row.AUTOID
  }

  async updateStatus(id: number, status: RequestStatus, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).where({ AUTOID: id }).update({ STATUS: status })
  }
}
