import type { Knex } from 'knex'
import { adjustFromDbDate } from '../../utils'
import { COMMAND_COLUMNS, COMMAND_TABLE, type Command } from '../models'

export interface CommandRepository {
  findByMachineAndCommandNo(
    machineId: number,
    commandNo: number,
    trx?: Knex.Transaction,
  ): Promise<Command | undefined>
}

export class KnexCommandRepository implements CommandRepository {
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
    return trx ? trx(COMMAND_TABLE) : this.db(COMMAND_TABLE)
  }

  async findByMachineAndCommandNo(
    machineId: number,
    commandNo: number,
    trx?: Knex.Transaction,
  ): Promise<Command | undefined> {
    const row = await this.qb(trx)
      .column(COMMAND_COLUMNS)
      .where({ MACHINEID: machineId, COMMANDNO: commandNo })
      .first()
    if (!row)
      return undefined
    return { ...row, changeTime: adjustFromDbDate(row.changeTime, this.tzOffset) }
  }
}
