import type { TonelloEvent } from '@teleskop/core'
import { TonelloApi } from '@teleskop/core'
import { asValue, createContainer } from 'awilix'
import pino from 'pino'
import { vi } from 'vitest'
import type { Machine, MachineStatus } from '../../src/db/models'
import type { MachineSessionDeps } from '../../src/services/MachineSession'
import { MachineSession } from '../../src/services/MachineSession'
import { makeMachine, makeMachineStatus } from '../mocks/fixtures'
import {
  makeAnalogIoValueRepository,
  makeBatchDataFilesRepository,
  makeBatchDataRepository,
  makeBatchPlanRepository,
  makeBatchStartEndRepository,
  makeBatchStepRepository,
  makeBatchStopRepository,
  makeChemicalRequestRepository,
  makeChemicalRequestStringRepository,
  makeCommandRepository,
  makeDigitalIoValueRepository,
  makeMachineStatusRepository,
  makeProgramHeaderRepository,
} from '../mocks/repositories'
import { makeKnex, makePlanningBoardService, makeTrx } from '../mocks/services'

// ─────────────────────────────────────────────────────────────────────────────
// TonelloApi spy
// ─────────────────────────────────────────────────────────────────────────────

export function mockTonelloApi(events: TonelloEvent[] = []) {
  const mock = {
    fetchEvents: vi.fn().mockResolvedValue({ from: 0, events }),
    submitChemicalRequestStatus: vi.fn().mockResolvedValue(undefined),
  }
  vi.spyOn(TonelloApi, 'createFromHostname').mockReturnValue(mock as unknown as TonelloApi)
  return mock
}

// ─────────────────────────────────────────────────────────────────────────────
// Test container — builds an Awilix container with vi.fn() mock implementations
// ─────────────────────────────────────────────────────────────────────────────

export interface TestContainerResult {
  /** The Awilix container — use `.cradle` to access mock instances for assertions. */
  cradle: MachineSessionDeps
  /** The Knex transaction mock (for asserting commit/rollback). */
  trx: ReturnType<typeof makeTrx>
}

export function makeTestContainer(
  overrides: Partial<MachineSessionDeps> = {},
): TestContainerResult {
  const trx = makeTrx()

  const defaults: MachineSessionDeps = {
    teleskop: makeKnex(trx),
    digitalIoFlushInterval: 0,
    machineStatusRepository: makeMachineStatusRepository(),
    batchDataRepository: makeBatchDataRepository(),
    batchStepRepository: makeBatchStepRepository(),
    batchStopRepository: makeBatchStopRepository(),
    batchStartEndRepository: makeBatchStartEndRepository(),
    analogIoValueRepository: makeAnalogIoValueRepository(),
    digitalIoValueRepository: makeDigitalIoValueRepository(),
    batchDataFilesRepository: makeBatchDataFilesRepository(),
    chemicalRequestRepository: makeChemicalRequestRepository(),
    chemicalRequestStringRepository: makeChemicalRequestStringRepository(),
    batchPlanRepository: makeBatchPlanRepository(),
    commandRepository: makeCommandRepository(),
    programHeaderRepository: makeProgramHeaderRepository(),
    planningBoardService: makePlanningBoardService(),
  }

  const merged = { ...defaults, ...overrides }

  const container = createContainer<MachineSessionDeps>()
  for (const [key, value] of Object.entries(merged)) {
    container.register(key, asValue(value))
  }

  return { cradle: container.cradle, trx }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session factory — wires a MachineSession using the test container
// ─────────────────────────────────────────────────────────────────────────────

const silentLogger = pino({ level: 'silent' })

export interface SessionTestContext {
  session: MachineSession
  /** Awilix cradle — access mock instances directly for assertions. */
  cradle: MachineSessionDeps
  trx: ReturnType<typeof makeTrx>
  tonelloApi: ReturnType<typeof mockTonelloApi>
}

export async function makeSession(
  opts: {
    machine?: Partial<Machine>
    status?: Partial<MachineStatus>
    events?: TonelloEvent[]
    deps?: Partial<MachineSessionDeps>
  } = {},
): Promise<SessionTestContext> {
  const tonelloApi = mockTonelloApi(opts.events ?? [])

  const { cradle, trx } = makeTestContainer({
    machineStatusRepository: makeMachineStatusRepository({
      findByMachineId: vi.fn().mockResolvedValue(makeMachineStatus(opts.status)),
    }),
    ...opts.deps,
  })

  const session = new MachineSession(makeMachine(opts.machine), silentLogger, cradle)
  await session.init()

  return { session, cradle, trx, tonelloApi }
}
