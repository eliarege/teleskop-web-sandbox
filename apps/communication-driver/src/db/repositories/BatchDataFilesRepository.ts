import type { Knex } from 'knex'
import {
  AnalogIoValue,
  BATCH_DATA_FILES_COLUMNS,
  BATCH_DATA_FILES_TABLE,
  DigitalIoValue,
} from '../models'
import { BinaryFileType } from '../enums'
import { promisify } from 'node:util'
import { gzip } from 'zlib'
import { booleanArrayToHex } from './DigitalIoValueRepository'
 
export interface BatchDataFilesRepository {
  insertAnalogValues(batchKey: number, analogValues: AnalogIoValue[], trx?: Knex.Transaction): Promise<void>
  insertDigitalValues(batchKey: number, digitalValues: DigitalIoValue[], trx?: Knex.Transaction): Promise<void>
}

interface ArchivedAnalogValue {
  logtime: Date
  ioType: number
  ioIndex: number
  ioValue: number
}

interface ArchivedDigitalValue {
  logtime: Date
  DI: string
  DOF: string
  DOL: string
}

const pGzip = promisify(gzip)

export class KnexBatchDataFilesRepository implements BatchDataFilesRepository {
  private readonly db: Knex

  constructor({ teleskop }: { teleskop: Knex }) {
    this.db = teleskop
  }

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx ? trx(BATCH_DATA_FILES_TABLE) : this.db(BATCH_DATA_FILES_TABLE)
  }

  async insertAnalogValues(batchKey: number, analogValues: AnalogIoValue[], trx?: Knex.Transaction): Promise<void> {
    const fileContent = await this.compressAnalogValues(analogValues)

    await this.qb(trx).insert({
      [BATCH_DATA_FILES_COLUMNS.batchKey]: batchKey,
      [BATCH_DATA_FILES_COLUMNS.fileType]: BinaryFileType.AnalogIO_JSON,
      [BATCH_DATA_FILES_COLUMNS.fileContent]: fileContent,
    })
  }

  async insertDigitalValues(batchKey: number, digitalValues: DigitalIoValue[], trx?: Knex.Transaction): Promise<void> {
    const fileContent = await this.compressDigitalValues(digitalValues)

    await this.qb(trx).insert({
      [BATCH_DATA_FILES_COLUMNS.batchKey]: batchKey,
      [BATCH_DATA_FILES_COLUMNS.fileType]: BinaryFileType.DigitalIO_JSON,
      [BATCH_DATA_FILES_COLUMNS.fileContent]: fileContent,
    })
  }

  private async compressAnalogValues(analogValues: AnalogIoValue[]): Promise<Buffer> {
    // Need to convert to `ArchivedAnalogValue` shape for compatibility with archive service
    const archivedAnalogValues: ArchivedAnalogValue[] = analogValues.map(av => ({
      logtime: av.logTime ?? new Date(0),
      ioType: av.ioType,
      ioIndex: av.ioIndex,
      ioValue: av.ioValue,
    }))
    return pGzip(Buffer.from(JSON.stringify(archivedAnalogValues), 'utf-8'))
  }

  private async compressDigitalValues(digitalValues: DigitalIoValue[]): Promise<Buffer> {
    // Need to convert to `ArchivedDigitalValue` shape for compatibility with archive service
    const archivedDigitalValues: ArchivedDigitalValue[] = digitalValues.map(dv => ({
      logtime: dv.logTime ?? new Date(0),
      DI: booleanArrayToHex(dv.diValues ?? []),
      DOF: booleanArrayToHex(dv.doFuncValues ?? []),
      DOL: booleanArrayToHex(dv.doLockValues ?? []),
    }))
    return pGzip(Buffer.from(JSON.stringify(archivedDigitalValues), 'utf-8'))
  }

}
