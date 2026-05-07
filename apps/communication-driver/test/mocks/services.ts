import type { TonelloEvent } from '@teleskop/core'
import type { Knex } from 'knex'
import { vi } from 'vitest'
import type { PlanningBoardService } from '../../src/services/PlanningBoardService'

/** Creates a Knex transaction mock that records committed/rolled-back state. */
export function makeTrx(): Knex.Transaction {
  const trx = {
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
  } as unknown as Knex.Transaction
  return trx
}

/** Creates a Knex instance mock where `.transaction()` returns the given trx. */
export function makeKnex(trx: Knex.Transaction): Knex {
  return {
    transaction: vi.fn().mockResolvedValue(trx),
  } as unknown as Knex
}

/** Creates a TonelloApi mock with controllable `fetchEvents` and `submitChemicalRequestStatus`. */
export function makeTonelloApiClass(events: TonelloEvent[] = []) {
  return {
    fetchEvents: vi.fn().mockResolvedValue({ from: 0, events }),
    submitChemicalRequestStatus: vi.fn().mockResolvedValue(undefined),
  }
}

export function makePlanningBoardService(
  overrides?: Partial<PlanningBoardService>,
): PlanningBoardService {
  return {
    unplanBatch: vi.fn().mockResolvedValue(undefined),
    addBatchNote: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as PlanningBoardService
}
