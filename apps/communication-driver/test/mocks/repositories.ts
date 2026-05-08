import { vi } from 'vitest'
import type { BatchData } from '../../src/db/models'
import type { AnalogIoValueRepository } from '../../src/db/repositories/AnalogIoValueRepository'
import type { BatchDataRepository } from '../../src/db/repositories/BatchDataRepository'
import type { BatchDataFilesRepository } from '../../src/db/repositories/BatchDataFilesRepository'
import type { BatchPlanRepository } from '../../src/db/repositories/BatchPlanRepository'
import type { BatchStartEndRepository } from '../../src/db/repositories/BatchStartEndRepository'
import type { BatchStepRepository } from '../../src/db/repositories/BatchStepRepository'
import type { BatchStopRepository } from '../../src/db/repositories/BatchStopRepository'
import type { ChemicalRequestRepository } from '../../src/db/repositories/ChemicalRequestRepository'
import type { ChemicalRequestStringRepository } from '../../src/db/repositories/ChemicalRequestStringRepository'
import type { CommandRepository } from '../../src/db/repositories/CommandRepository'
import type { DigitalIoValueRepository } from '../../src/db/repositories/DigitalIoValueRepository'
import type { MachineStatusRepository } from '../../src/db/repositories/MachineStatusRepository'
import type { ProgramHeaderRepository } from '../../src/db/repositories/ProgramHeaderRepository'

export function makeMachineStatusRepository(
  overrides?: Partial<MachineStatusRepository>,
): MachineStatusRepository {
  return {
    findByMachineId: vi.fn().mockResolvedValue(undefined),
    ensureExists: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    setRunningBatch: vi.fn().mockResolvedValue(undefined),
    clearRunningBatch: vi.fn().mockResolvedValue(undefined),
    setRunningCommand: vi.fn().mockResolvedValue(undefined),
    setBatchLoaded: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function makeDefaultBatchData(overrides?: Partial<BatchData>): BatchData {
  return {
    batchKey: 1001,
    machineId: 10,
    machineCode: 'TEST-01',
    jobOrder: 'TEST-ORDER',
    startTime: new Date('2026-04-04T08:00:00Z'),
    endTime: null,
    cancelTime: null,
    ...overrides,
  } as BatchData
}

export function makeBatchDataRepository(
  overrides?: Partial<BatchDataRepository>,
): BatchDataRepository {
  return {
    findByKey: vi.fn().mockResolvedValue(undefined),
    findOpenByMachineId: vi.fn().mockResolvedValue(undefined),
    insert: vi.fn().mockResolvedValue(undefined),
    insertAndReturn: vi
      .fn()
      .mockImplementation((data: { jobOrder?: string }) =>
        Promise.resolve(makeDefaultBatchData({ jobOrder: data.jobOrder ?? 'TEST-ORDER' })),
      ),
    update: vi.fn().mockResolvedValue(undefined),
    setEndTime: vi.fn().mockResolvedValue(undefined),
    setCancelTime: vi.fn().mockResolvedValue(undefined),
    setFinishReasonId: vi.fn().mockResolvedValue(undefined),
    markAdditionStarted: vi.fn().mockResolvedValue(undefined),
    getNextBatchReference: vi.fn().mockResolvedValue('REF-001'),
    ...overrides,
  }
}

export function makeBatchStepRepository(
  overrides?: Partial<BatchStepRepository>,
): BatchStepRepository {
  return {
    findByKey: vi.fn().mockResolvedValue(undefined),
    findOpenSteps: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockResolvedValue(undefined),
    setEndTime: vi.fn().mockResolvedValue(undefined),
    closeAllOpen: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function makeBatchStopRepository(
  overrides?: Partial<BatchStopRepository>,
): BatchStopRepository {
  return {
    findByBatchKey: vi.fn().mockResolvedValue([]),
    findLatestOpen: vi.fn().mockResolvedValue(undefined),
    insert: vi.fn().mockResolvedValue(undefined),
    closeLatestOpen: vi.fn().mockResolvedValue(undefined),
    closeLatestOpenForMachine: vi.fn().mockResolvedValue(undefined),
    setStopReason: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function makeBatchStartEndRepository(
  overrides?: Partial<BatchStartEndRepository>,
): BatchStartEndRepository {
  return {
    insert: vi.fn().mockResolvedValue(undefined),
    findByJobOrder: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

export function makeBatchPlanRepository(
  overrides?: Partial<BatchPlanRepository>,
): BatchPlanRepository {
  return {
    findByKey: vi.fn().mockResolvedValue(undefined),
    findLatestByJobOrder: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function makeAnalogIoValueRepository(
  overrides?: Partial<AnalogIoValueRepository>,
): AnalogIoValueRepository {
  return {
    findByBatchKey: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockResolvedValue(undefined),
    deleteByBatchKey: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function makeDigitalIoValueRepository(
  overrides?: Partial<DigitalIoValueRepository>,
): DigitalIoValueRepository {
  return {
    findByBatchKey: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockResolvedValue(undefined),
    deleteByBatchKey: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function makeChemicalRequestRepository(
  overrides?: Partial<ChemicalRequestRepository>,
): ChemicalRequestRepository {
  return {
    findByBatchKey: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function makeChemicalRequestStringRepository(
  overrides?: Partial<ChemicalRequestStringRepository>,
): ChemicalRequestStringRepository {
  return {
    insert: vi.fn().mockResolvedValue(undefined),
    findByBatchKey: vi.fn().mockResolvedValue([]),
    findRequests: vi.fn().mockResolvedValue([]),
    findResponses: vi.fn().mockResolvedValue([]),
    findAllPendingResponses: vi.fn().mockResolvedValue([]),
    consumeLatestResponse: vi.fn().mockResolvedValue(undefined),
    deleteById: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function makeCommandRepository(overrides?: Partial<CommandRepository>): CommandRepository {
  return {
    findByMachineAndCommandNo: vi.fn().mockResolvedValue({ name: 'MockCommand', commandNo: 1 }),
    ...overrides,
  }
}

export function makeProgramHeaderRepository(
  overrides?: Partial<ProgramHeaderRepository>,
): ProgramHeaderRepository {
  return {
    findByMachineAndProgramNo: vi.fn().mockResolvedValue({ name: 'MockProgram', programNo: 100 }),
    ...overrides,
  }
}

export function makeBatchDataFilesRepository(
  overrides?: Partial<BatchDataFilesRepository>,
): BatchDataFilesRepository {
  return {
    insertAnalogValues: vi.fn().mockResolvedValue(undefined),
    insertDigitalValues: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}
