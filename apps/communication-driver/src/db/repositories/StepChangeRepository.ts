import type { Knex } from 'knex'
import { adjustToDbDate } from '../../utils'
import { STEP_CHANGE_TABLE, type StepChangeInsert } from '../models'

export interface StepChangeRepository {
  insert(data: StepChangeInsert, trx?: Knex.Transaction): Promise<void>
}

export class KnexStepChangeRepository implements StepChangeRepository {
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
    return trx ? trx(STEP_CHANGE_TABLE) : this.db(STEP_CHANGE_TABLE)
  }

  async insert(data: StepChangeInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      BATCHKEY: data.batchKey,
      CHANGEDATE: adjustToDbDate(data.changeDate, this.tzOffset),
      MAINSTEP: data.mainStep,
      PARALELSTEP: data.parallelStep,
      COMMANDNO: data.commandNo,
      STEPADDED: data.stepAdded,
    })
  }
}
