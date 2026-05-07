import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate } from '../../utils'
import {
  BATCH_PARAMETER_COLUMNS,
  BATCH_PARAMETER_TABLE,
  type BatchParameter,
  type BatchParameterInsert,
} from '../models'

export interface BatchParameterRepository {
  findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<BatchParameter[]>
  insert(data: BatchParameterInsert, trx?: Knex.Transaction): Promise<void>
}

export class KnexBatchParameterRepository implements BatchParameterRepository {
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
    return trx ? trx(BATCH_PARAMETER_TABLE) : this.db(BATCH_PARAMETER_TABLE)
  }

  async findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<BatchParameter[]> {
    const rows = await this.qb(trx).column(BATCH_PARAMETER_COLUMNS).where({ BATCHKEY: batchKey })
    return rows.map((row: any) => ({
      ...row,
      changeDate: adjustFromDbDate(row.changeDate, this.tzOffset),
    }))
  }

  async insert(data: BatchParameterInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      BATCHKEY: data.batchKey,
      BATCHPARAMETERID: data.batchParameterId,
      CHANGEDATE: adjustToDbDate(data.changeDate, this.tzOffset),
      PARAMSTRING: data.paramName,
      VALUE: data.value,
      PARAMETERTYPE: data.parameterType,
      SELECTIONLIST: data.selectionList,
      PROGNO: data.programNo,
      PROGNAME: data.programName,
    } satisfies TableRecord<typeof BATCH_PARAMETER_COLUMNS>)
  }
}
