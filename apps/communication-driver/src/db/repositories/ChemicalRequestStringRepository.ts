import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import { adjustFromDbDate, adjustToDbDate } from '../../utils'
import {
  CHEMICAL_REQUEST_STRING_COLUMNS,
  CHEMICAL_REQUEST_STRING_TABLE,
  type ChemicalRequestString,
  type ChemicalRequestStringInsert,
  type ChemicalRequestStringParsed,
  type ChemicalRequestStringResponseParsed,
} from '../models'

function buildRequestString(data: ChemicalRequestStringParsed): string {
  return [
    data.requestType,
    data.priority,
    data.machineNo,
    data.tankNo,
    data.jobOrder,
    data.programNo,
    data.requestOrder,
    data.requestOrder,
    data.totalRequests,
    data.materialType,
    data.programIndex,
  ].join(',')
}

/**
 * Parses a response REQUEST string written by Dispensing Manager.
 * Format: `status,priority,machineNo,tankNo,jobOrder,programNo,requestOrderInBatch,requestOrderInProgram,totalRequests,materialType,programIndex`
 * The first field is a `RequestStatus` value; all other fields mirror the original request.
 */
function parseResponseString(raw: string): ChemicalRequestStringResponseParsed {
  const parts = raw.split(',')
  return {
    status: Number(parts[0]) as ChemicalRequestStringResponseParsed['status'],
    priority: Number(parts[1]),
    machineNo: Number(parts[2]),
    tankNo: Number(parts[3]),
    jobOrder: parts[4],
    programNo: Number(parts[5]),
    requestOrder: Number(parts[6]), // part 6 and 7 are same for legacy reasons
    totalRequests: Number(parts[8]),
    materialType: Number(parts[9]) as ChemicalRequestStringResponseParsed['materialType'],
    programIndex: Number(parts[10]),
  }
}

export interface ChemicalRequestStringRepository {
  insert(data: ChemicalRequestStringInsert, trx?: Knex.Transaction): Promise<void>
  findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequestString[]>
  findRequests(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequestString[]>
  findResponses(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequestString[]>
  /** Returns all pending response rows (ISREQUEST = 0) across all batches, ordered by ID ascending. Used by the DM response polling loop. */
  findAllPendingResponses(
    trx?: Knex.Transaction,
  ): Promise<Array<ChemicalRequestString & { parsed: ChemicalRequestStringResponseParsed }>>
  /** Reads the latest response for a batch and deletes it in the same transaction. */
  consumeLatestResponse(
    batchKey: number,
    trx?: Knex.Transaction,
  ): Promise<ChemicalRequestString | undefined>
  deleteById(id: number, trx?: Knex.Transaction): Promise<void>
}

export class KnexChemicalRequestStringRepository implements ChemicalRequestStringRepository {
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
    return trx ? trx(CHEMICAL_REQUEST_STRING_TABLE) : this.db(CHEMICAL_REQUEST_STRING_TABLE)
  }

  private deserialize(row: any): ChemicalRequestString {
    return { ...row, requestTime: adjustFromDbDate(row.requestTime, this.tzOffset) }
  }

  async insert(data: ChemicalRequestStringInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      REQUEST: buildRequestString(data),
      BATCHKEY: data.batchKey,
      REQUESTTIME: adjustToDbDate(data.requestTime, this.tzOffset),
      ISREQUEST: data.isRequest ? 1 : 0,
    } satisfies TableRecord<typeof CHEMICAL_REQUEST_STRING_COLUMNS>)
  }

  async findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequestString[]> {
    const rows = await this.qb(trx)
      .column(CHEMICAL_REQUEST_STRING_COLUMNS)
      .where({ BATCHKEY: batchKey })
    return rows.map((row: any) => this.deserialize(row))
  }

  /** Returns all request rows (ISREQUEST = 1) for the given batch. */
  async findRequests(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequestString[]> {
    const rows = await this.qb(trx)
      .column(CHEMICAL_REQUEST_STRING_COLUMNS)
      .where({ BATCHKEY: batchKey, ISREQUEST: 1 })
    return rows.map((row: any) => this.deserialize(row))
  }

  /** Returns all response rows (ISREQUEST = 0) for the given batch. */
  async findResponses(batchKey: number, trx?: Knex.Transaction): Promise<ChemicalRequestString[]> {
    const rows = await this.qb(trx)
      .column(CHEMICAL_REQUEST_STRING_COLUMNS)
      .where({ BATCHKEY: batchKey, ISREQUEST: 0 })
    return rows.map((row: any) => this.deserialize(row))
  }

  async findAllPendingResponses(
    trx?: Knex.Transaction,
  ): Promise<Array<ChemicalRequestString & { parsed: ChemicalRequestStringResponseParsed }>> {
    const rows = (await this.qb(trx)
      .column(CHEMICAL_REQUEST_STRING_COLUMNS)
      .where({ ISREQUEST: 0 })
      .orderBy('ID', 'asc')) as ChemicalRequestString[]
    return rows.map(row => ({
      ...this.deserialize(row),
      parsed: parseResponseString(row.request ?? ''),
    }))
  }

  /** Returns the most recent response row for the given batch, if any. */
  async findLatestResponse(
    batchKey: number,
    trx?: Knex.Transaction,
  ): Promise<ChemicalRequestString | undefined> {
    const row = await this.qb(trx)
      .column(CHEMICAL_REQUEST_STRING_COLUMNS)
      .where({ BATCHKEY: batchKey, ISREQUEST: 0 })
      .orderBy('ID', 'desc')
      .first()
    return row ? this.deserialize(row) : undefined
  }

  /**
   * Reads the latest response for a batch and immediately deletes it.
   * Returns the response row, or `undefined` if none exists.
   */
  async consumeLatestResponse(
    batchKey: number,
    trx?: Knex.Transaction,
  ): Promise<ChemicalRequestString | undefined> {
    const row = await this.findLatestResponse(batchKey, trx)
    if (row) {
      await this.deleteById(row.id, trx)
    }
    return row
  }

  async deleteById(id: number, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).where({ ID: id }).delete()
  }
}
