import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate, splitNumberList } from '../../utils'
import {
  BATCH_START_END_COLUMNS,
  BATCH_START_END_TABLE,
  type BatchStartEnd,
  type BatchStartEndInsert,
} from '../models'

export interface BatchStartEndRepository {
  insert(data: BatchStartEndInsert, trx?: Knex.Transaction): Promise<void>
  findByJobOrder(jobOrder: string, trx?: Knex.Transaction): Promise<BatchStartEnd[]>
}

export class KnexBatchStartEndRepository implements BatchStartEndRepository {
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
    return trx ? trx(BATCH_START_END_TABLE) : this.db(BATCH_START_END_TABLE)
  }

  async insert(data: BatchStartEndInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      JOBORDER: data.jobOrder,
      MACHINEID: data.machineId,
      STATE: data.state,
      DATE: adjustToDbDate(data.date, this.tzOffset),
      PROGRAMNOLIST: data.programNoList.join('-'),
      TOTALREQUESTCOUNT: data.totalRequestCount,
    } satisfies TableRecord<typeof BATCH_START_END_COLUMNS>)
  }

  async findByJobOrder(jobOrder: string, trx?: Knex.Transaction): Promise<BatchStartEnd[]> {
    const rows: any[] = await this.qb(trx)
      .column(BATCH_START_END_COLUMNS)
      .where({ JOBORDER: jobOrder })
      .orderBy('AUTOID', 'asc')
    return rows.map(row => ({
      ...row,
      programNoList: splitNumberList(row.programNoList, '-'),
      date: adjustFromDbDate(row.date, this.tzOffset),
    }))
  }
}
