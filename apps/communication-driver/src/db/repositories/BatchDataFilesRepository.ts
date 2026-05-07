import type { Knex } from 'knex'
import {
  BATCH_DATA_FILES_COLUMNS,
  BATCH_DATA_FILES_TABLE,
  type BatchDataFileInsert,
} from '../models'

export interface BatchDataFilesRepository {
  insert(data: BatchDataFileInsert, trx?: Knex.Transaction): Promise<void>
}

export class KnexBatchDataFilesRepository implements BatchDataFilesRepository {
  private readonly db: Knex

  constructor({ teleskop }: { teleskop: Knex }) {
    this.db = teleskop
  }

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx ? trx(BATCH_DATA_FILES_TABLE) : this.db(BATCH_DATA_FILES_TABLE)
  }

  async insert(data: BatchDataFileInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      [BATCH_DATA_FILES_COLUMNS.batchKey]: data.batchKey,
      [BATCH_DATA_FILES_COLUMNS.fileType]: data.fileType,
      [BATCH_DATA_FILES_COLUMNS.fileContent]: data.fileContent,
    })
  }
}
