import type { Knex } from 'knex'
import type { Batch } from '../types'

export interface BatchRepository {
  getBatch: (key: number) => Promise<Batch | null>
}

export class KnexBatchRepository implements BatchRepository {
  constructor(private db: Knex) {}

  async getBatch(batchKey: number): Promise<Batch | null> {
    const batch = await this.db
      .from('BADATA')
      .first({
        batchKey: 'BATCHKEY',
        machineId: 'MACHINEID',
        startTime: 'STARTTIME',
      })
      .where('BATCHKEY', batchKey)

    return batch || null
  }
}

export class MockBatchRepository implements BatchRepository {
  private batches: Batch[]

  constructor(batches: Batch[]) {
    this.batches = batches
  }

  async getBatch(batchKey: number): Promise<Batch | null> {
    const batch = this.batches.find(b => b.batchKey === batchKey)
    return batch || null
  }
}
