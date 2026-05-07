import type { Knex } from 'knex'
import { adjustFromDbDate } from '../../utils'
import { BATCH_PLAN_COLUMNS, BATCH_PLAN_TABLE, type BatchPlan } from '../models'

export interface BatchPlanRepository {
  findByKey(planKey: number, trx?: Knex.Transaction): Promise<BatchPlan | undefined>
  /**
   * Returns the active plan for a job order — the row where `lastForJoborder = true`.
   * When multiple plan rows exist for the same job order (e.g. corrections), only this
   * row represents the current planned state.
   */
  findLatestByJobOrder(jobOrder: string, trx?: Knex.Transaction): Promise<BatchPlan | undefined>
}

export class KnexBatchPlanRepository implements BatchPlanRepository {
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
    return trx ? trx(BATCH_PLAN_TABLE) : this.db(BATCH_PLAN_TABLE)
  }

  private deserialize(row: any): BatchPlan {
    return {
      ...row,
      recordTime: adjustFromDbDate(row.recordTime, this.tzOffset),
      plannedStartTime: adjustFromDbDate(row.plannedStartTime, this.tzOffset),
      startDateTime: adjustFromDbDate(row.startDateTime, this.tzOffset),
      theoreticalStartTime: adjustFromDbDate(row.theoreticalStartTime, this.tzOffset),
    }
  }

  async findByKey(planKey: number, trx?: Knex.Transaction): Promise<BatchPlan | undefined> {
    const row = await this.qb(trx).column(BATCH_PLAN_COLUMNS).where({ PLANKEY: planKey }).first()
    return row ? this.deserialize(row) : undefined
  }

  async findLatestByJobOrder(
    jobOrder: string,
    trx?: Knex.Transaction,
  ): Promise<BatchPlan | undefined> {
    const row = await this.qb(trx)
      .column(BATCH_PLAN_COLUMNS)
      .where({ JOBORDER: jobOrder, lastForJoborder: true })
      .first()
    return row ? this.deserialize(row) : undefined
  }
}
