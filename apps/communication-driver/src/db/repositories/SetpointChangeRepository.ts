import type { Knex } from 'knex'
import { adjustToDbDate } from '../../utils'
import { SETPOINT_CHANGE_TABLE, type SetpointChangeInsert } from '../models'

export interface SetpointChangeRepository {
  insert(data: SetpointChangeInsert, trx?: Knex.Transaction): Promise<void>
}

export class KnexSetpointChangeRepository implements SetpointChangeRepository {
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
    return trx ? trx(SETPOINT_CHANGE_TABLE) : this.db(SETPOINT_CHANGE_TABLE)
  }

  async insert(data: SetpointChangeInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      BATCHKEY: data.batchKey,
      CHANGEDATE: adjustToDbDate(data.changeDate, this.tzOffset),
      PROGNO: data.programNo,
      PROGINDEXINBATCH: data.programIndexInBatch,
      MAINSTEP: data.mainStep,
      PARALELSTEP: data.parallelStep,
      COMMANDNO: data.commandNo,
      SPINDEX: data.setpointIndex,
      OLDVALUE: data.oldValue,
      NEWVALUE: data.newValue,
      PRGINDEX: data.programIndex,
      PHASENO: data.phaseNo,
      PHASEINDEX: data.phaseIndex,
    })
  }
}
