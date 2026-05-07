import type { Knex } from 'knex'
import { adjustToDbDate } from '../../utils'
import { CALCULATED_VALUE_TABLE, type CalculatedValueInsert } from '../models'

export interface CalculatedValueRepository {
  insert(data: CalculatedValueInsert, trx?: Knex.Transaction): Promise<void>
}

export class KnexCalculatedValueRepository implements CalculatedValueRepository {
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
    return trx ? trx(CALCULATED_VALUE_TABLE) : this.db(CALCULATED_VALUE_TABLE)
  }

  async insert(data: CalculatedValueInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      BATCHKEY: data.batchKey,
      LOGTIME: adjustToDbDate(data.logTime, this.tzOffset),
      PROGNO: data.programNo,
      VALUEID: data.valueId,
      VALUE: data.value,
      PRGINDEX: data.programIndex,
      PHASENO: data.phaseNo,
      PHASEINDEX: data.phaseIndex,
    })
  }
}
