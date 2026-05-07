import type { Knex } from 'knex'
import type { TableRecord } from '@teleskop/utils'
import {
  BATCH_CONSUMPTION_COLUMNS,
  BATCH_CONSUMPTION_TABLE,
  type BatchConsumption,
  type BatchConsumptionInsert,
  type BatchConsumptionUpdate,
} from '../models'

export interface BatchConsumptionRepository {
  findByBatchKey(batchKey: number, trx?: Knex.Transaction): Promise<BatchConsumption | undefined>
  insert(data: BatchConsumptionInsert, trx?: Knex.Transaction): Promise<void>
  update(batchKey: number, data: BatchConsumptionUpdate, trx?: Knex.Transaction): Promise<void>
  upsert(data: BatchConsumptionInsert, trx?: Knex.Transaction): Promise<void>
}

export class KnexBatchConsumptionRepository implements BatchConsumptionRepository {
  private readonly db: Knex

  constructor({ teleskop }: { teleskop: Knex }) {
    this.db = teleskop
  }

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx ? trx(BATCH_CONSUMPTION_TABLE) : this.db(BATCH_CONSUMPTION_TABLE)
  }

  async findByBatchKey(
    batchKey: number,
    trx?: Knex.Transaction,
  ): Promise<BatchConsumption | undefined> {
    return this.qb(trx).column(BATCH_CONSUMPTION_COLUMNS).where({ BATCHKEY: batchKey }).first()
  }

  async insert(data: BatchConsumptionInsert, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx).insert({
      MACHINEID: data.machineId,
      BATCHKEY: data.batchKey,
      FM1VALUE: data.flowmeter1,
      FM2VALUE: data.flowmeter2,
      FM3VALUE: data.flowmeter3,
      FM4VALUE: data.flowmeter4,
      FM5VALUE: data.flowmeter5,
      FM6VALUE: data.flowmeter6,
      FM7VALUE: data.flowmeter7,
      FM8VALUE: data.flowmeter8,
      FM9VALUE: data.flowmeter9,
      FM10VALUE: data.flowmeter10,
      ELECTRICITY: data.electricity,
      ELECTRICITY_EXPORT: data.electricityExport,
      ELECTRICITY_CAPACITIVE: data.electricityCapacitive,
      ELECTRICITY_REACTIVE: data.electricityReactive,
      STEAM: data.steam,
      WaterType1: data.waterType1,
      WaterType2: data.waterType2,
      WaterType3: data.waterType3,
      WaterType4: data.waterType4,
      WaterType5: data.waterType5,
      WaterType6: data.waterType6,
      WaterTotal: data.waterTotal,
      COUNTER1: data.counter1,
      COUNTER2: data.counter2,
      SALT: data.salt,
    } satisfies TableRecord<typeof BATCH_CONSUMPTION_COLUMNS>)
  }

  async update(
    batchKey: number,
    data: BatchConsumptionUpdate,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const columnMap = BATCH_CONSUMPTION_COLUMNS as Record<string, string>
    const row: Record<string, unknown> = {}
    for (const [camelKey, dbCol] of Object.entries(columnMap)) {
      if (camelKey in data) {
        row[dbCol] = data[camelKey as keyof BatchConsumptionUpdate]
      }
    }
    if (Object.keys(row).length === 0)
      return
    await this.qb(trx).where({ BATCHKEY: batchKey }).update(row)
  }

  async upsert(data: BatchConsumptionInsert, trx?: Knex.Transaction): Promise<void> {
    const existing = await this.findByBatchKey(data.batchKey, trx)
    if (existing) {
      const { machineId: _m, batchKey: _b, ...updateData } = data
      await this.update(data.batchKey, updateData, trx)
    } else {
      await this.insert(data, trx)
    }
  }
}
