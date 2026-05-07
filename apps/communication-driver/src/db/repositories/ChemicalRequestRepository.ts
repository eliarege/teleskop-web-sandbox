import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate } from '../../utils'
import {
  CHEMICAL_REQUEST_COLUMNS,
  CHEMICAL_REQUEST_TABLE,
  type ChemicalRequest,
  type ChemicalRequestInsert,
} from '../models'

export interface ChemicalRequestRepository {
  findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequest[]>
  insert(data: ChemicalRequestInsert, trx?: Knex.Transaction): Promise<void>
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

  async findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequest[]> {
    const rows = await this.qb(trx).column(CHEMICAL_REQUEST_COLUMNS).where({ BATCHKEY: batchKey })
    return rows.map((row: any) => ({
      ...row,
      requestTime: adjustFromDbDate(row.requestTime, this.tzOffset),
    }))
  }

  async insert(data: ChemicalRequestInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      BATCHKEY: data.batchKey,
      REQUESTTIME: adjustToDbDate(data.requestTime, this.tzOffset),
      JobOrder: data.jobOrder,
      RECEIPEINDEX: data.recipeIndex,
      RequestOrderIndex: data.requestOrderIndex,
      OPERATIONCode: data.operationCode,
      TargetRECIPE: data.targetRecipe,
      TankNo: data.tankNo,
      PRIORITY: data.priority,
      TotalNumberOfRequest: data.totalNumberOfRequest,
      ProgramNo: data.programNo,
      COMMANDNO: data.commandNo,
      STATUS: data.status ?? null,
    } satisfies TableRecord<typeof CHEMICAL_REQUEST_COLUMNS>)
  }
}
