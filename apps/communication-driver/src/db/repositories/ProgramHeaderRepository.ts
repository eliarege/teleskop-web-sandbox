import type { Knex } from 'knex'
import { adjustFromDbDate } from '../../utils'
import { PROGRAM_HEADER_COLUMNS, PROGRAM_HEADER_TABLE, type ProgramHeader } from '../models'

export interface ProgramHeaderRepository {
  findByMachineAndProgramNo(
    machineId: number,
    programNo: number,
    trx?: Knex.Transaction,
  ): Promise<ProgramHeader | undefined>
}

export class KnexProgramHeaderRepository implements ProgramHeaderRepository {
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
    return trx ? trx(PROGRAM_HEADER_TABLE) : this.db(PROGRAM_HEADER_TABLE)
  }

  async findByMachineAndProgramNo(
    machineId: number,
    programNo: number,
    trx?: Knex.Transaction,
  ): Promise<ProgramHeader | undefined> {
    const row = await this.qb(trx)
      .column(PROGRAM_HEADER_COLUMNS)
      .where({ MACHINEID: machineId, PROGNO: programNo })
      .first()
    if (!row)
      return undefined
    return {
      ...row,
      changeDate: adjustFromDbDate(row.changeDate, this.tzOffset),
      creationDate: adjustFromDbDate(row.creationDate, this.tzOffset),
    }
  }
}
