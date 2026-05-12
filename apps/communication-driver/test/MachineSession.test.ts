import { TonelloChemicalRequestStatus, TonelloChemicalRequestType, TonelloIoType } from '@teleskop/core'
import pino from 'pino'
/**
 * MachineSession event-processing tests.
 *
 * Each test drives the session by directly calling poll() via mocked fetchEvents,
 * then inspects which repository methods were called and with what arguments.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConnectionStatus, MaterialType, RequestStatus } from '../src/db/enums'
import type { BatchData } from '../src/db/models'
import { MachineSession } from '../src/services/MachineSession'
import { makeSession, makeTestContainer } from './helpers/container'
import {
  analogIoChangedEvent,
  batchCancelledEvent,
  batchEndEvent,
  batchStartEvent,
  chemicalRequestEvent,
  commandFinishEvent,
  commandStartEvent,
  digitalIoChangedEvent,
  events,
  machineId,
  makeChemicalResponse,
  makeDate,
  makeMachine,
  resetIds,
} from './mocks/fixtures'
import { makeAnalogIoValueRepository, makeBatchDataRepository, makeChemicalRequestRepository, makeDigitalIoValueRepository, makeMachineStatusRepository, makeProgramHeaderRepository } from './mocks/repositories'

beforeEach(() => {
  resetIds()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// Helper: run a single poll cycle with a given event list
// ─────────────────────────────────────────────────────────────────────────────

async function runPoll(ctx: { session: MachineSession }): Promise<void> {
  await (ctx.session as unknown as { poll(): Promise<void> }).poll()
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BatchStartEvent — happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('batchStartEvent', () => {
  it('inserts a batch and updates in-memory status', async () => {
    const ctx = await makeSession({
      events: events(batchStartEvent({ batchCode: 'ORDER-1' })),
    })

    await runPoll(ctx)

    expect(ctx.cradle.batchDataRepository.insertAndReturn).toHaveBeenCalledOnce()
    const insertArg = vi.mocked(ctx.cradle.batchDataRepository.insertAndReturn).mock.calls[0][0]
    expect(insertArg.jobOrder).toBe('ORDER-1')
    expect(insertArg.machineId).toBe(machineId)

    expect(ctx.cradle.batchStartEndRepository.insert).toHaveBeenCalledOnce()
    expect(ctx.cradle.batchStopRepository.closeLatestOpenForMachine).toHaveBeenCalledOnce()
    expect(ctx.session.runningBatchKey).toBe(1001)
  })

  it('links the planned machine when job order is in the plan', async () => {
    const plannedBatch = { planKey: 55, plannedMachine: 99, jobOrder: 'ORDER-P' } as any
    const ctx = await makeSession({
      events: events(batchStartEvent({ batchCode: 'ORDER-P' })),
    })
    vi.mocked(ctx.cradle.batchPlanRepository.findLatestByJobOrder).mockResolvedValue(plannedBatch)

    await runPoll(ctx)

    const insertArg = vi.mocked(ctx.cradle.batchDataRepository.insertAndReturn).mock.calls[0][0]
    expect(insertArg.plannedMachineId).toBe(99)
    expect(insertArg.planKey).toBe(55)
    expect(ctx.cradle.planningBoardService.unplanBatch).toHaveBeenCalledWith(55)
  })

  it('force-cancels an uncompleted previous batch before starting the new one', async () => {
    const prevBatch: BatchData = {
      batchKey: 900,
      jobOrder: 'OLD',
      machineId,
      machineCode: 'TEST-01',
      startTime: new Date('2026-04-04T07:00:00Z'),
      endTime: null,
      cancelTime: null,
    } as unknown as BatchData

    // Supply findByKey BEFORE init() runs so activeBatch is loaded on first init
    const ctx = await makeSession({
      status: { runningBatchKey: 900 },
      events: events(batchStartEvent({ batchCode: 'NEW' })),
      deps: {
        batchDataRepository: makeBatchDataRepository({
          findByKey: vi.fn().mockResolvedValue(prevBatch),
        }),
      },
    })

    await runPoll(ctx)

    expect(ctx.cradle.batchDataRepository.update).toHaveBeenCalledWith(
      900,
      expect.objectContaining({ cancelTime: expect.any(Date) }),
      expect.anything(),
    )
    expect(ctx.cradle.batchStepRepository.closeAllOpen).toHaveBeenCalledWith(
      900,
      expect.any(Date),
      expect.anything(),
    )
    expect(ctx.cradle.batchDataRepository.insertAndReturn).toHaveBeenCalledOnce()
  })

  it('clears pending chemical requests when force-cancelling a previous batch', async () => {
    const prevBatch: BatchData = {
      batchKey: 900,
      jobOrder: 'OLD',
      machineId,
      machineCode: 'TEST-01',
      startTime: new Date('2026-04-04T07:00:00Z'),
      endTime: null,
      cancelTime: null,
    } as unknown as BatchData

    const ctx = await makeSession({
      status: { runningBatchKey: 900 },
      events: events(batchStartEvent({ batchCode: 'NEW' })),
      deps: {
        batchDataRepository: makeBatchDataRepository({
          findByKey: vi.fn().mockResolvedValue(prevBatch),
        }),
        chemicalRequestRepository: makeChemicalRequestRepository({
          findByBatchKey: vi.fn().mockResolvedValue([
            {
              id: 42,
              batchKey: 900,
              requestTime: new Date(),
              jobOrder: 'OLD',
              recipeIndex: 0,
              requestOrderIndex: 1,
              operationCode: 42,
              targetRecipe: 0,
              tankNo: 7,
              priority: 50,
              totalRequestsInProgram: 1,
              programNo: 100,
              commandNo: 1,
              status: RequestStatus.New,
              tonelloEvent: chemicalRequestEvent({ requestOrder: 1, batchCode: 'OLD', offsetSeconds: 0 }),
            },
          ]),
        }),
      },
    })

    await runPoll(ctx)

    // After force-cancel, a response for the old request should be skipped
    await expect(
      ctx.session.handleChemicalRequestResponses([
        {
          id: 50,
          batchKey: 900,
          parsed: makeChemicalResponse({ status: RequestStatus.Completed, jobOrder: 'OLD' }),
        },
      ]),
    ).resolves.not.toThrow()

    expect(ctx.tonelloApi.submitChemicalRequestStatus).not.toHaveBeenCalled()
  })

  it('ignores a duplicate BatchStartEvent for the same job order', async () => {
    // First poll: start batch
    const ctx = await makeSession({ events: events(batchStartEvent({ batchCode: 'ALPHA' })) })
    await runPoll(ctx)
    expect(ctx.cradle.batchDataRepository.insertAndReturn).toHaveBeenCalledTimes(1)

    // Second poll: another BatchStartEvent for the same code
    ctx.tonelloApi.fetchEvents.mockResolvedValue({
      from: 0,
      events: events(batchStartEvent({ batchCode: 'ALPHA' })),
    })
    vi.mocked(ctx.cradle.machineStatusRepository.update).mockClear()
    await runPoll(ctx)

    // Should NOT have inserted again
    expect(ctx.cradle.batchDataRepository.insertAndReturn).toHaveBeenCalledTimes(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. BatchEndEvent
// ─────────────────────────────────────────────────────────────────────────────

describe('batchEndEvent', () => {
  it('finalizes batch, creates a BatchStop, and clears in-memory state', async () => {
    const ctx = await makeSession({
      events: events(batchStartEvent({ batchCode: 'ALPHA' }), batchEndEvent({ batchCode: 'ALPHA', offsetSeconds: 100 })),
    })

    await runPoll(ctx)

    expect(ctx.cradle.batchDataRepository.update).toHaveBeenCalledWith(
      1001,
      expect.objectContaining({ endTime: expect.any(Date), realDuration: 100 }),
      expect.anything(),
    )
    expect(ctx.cradle.batchStopRepository.insert).toHaveBeenCalledOnce()
    expect(ctx.cradle.batchStartEndRepository.insert).toHaveBeenCalledTimes(2) // start + end
    expect(ctx.session.runningBatchKey).toBeNull()
  })

  it('clears pending chemical requests on batch end', async () => {
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        chemicalRequestEvent({ requestOrder: 1, batchCode: 'ALPHA', offsetSeconds: 15 }),
        batchEndEvent({ batchCode: 'ALPHA', offsetSeconds: 100 }),
      ),
    })

    await runPoll(ctx)

    // After batch end, a response for the old request should be skipped
    await expect(
      ctx.session.handleChemicalRequestResponses([
        {
          id: 50,
          batchKey: 1001,
          parsed: makeChemicalResponse({ status: RequestStatus.Completed }),
        },
      ]),
    ).resolves.not.toThrow()

    expect(ctx.tonelloApi.submitChemicalRequestStatus).not.toHaveBeenCalled()
  })

  it('is ignored when no active batch is running', async () => {
    const ctx = await makeSession({ events: events(batchEndEvent({ batchCode: 'GHOST' })) })

    await runPoll(ctx)

    expect(ctx.cradle.batchDataRepository.update).not.toHaveBeenCalled()
    expect(ctx.cradle.batchStopRepository.insert).not.toHaveBeenCalled()
  })

  it('archives and deletes IO values after batch ends', async () => {
    const ctx = await makeSession({
      deps: {
        analogIoValueRepository: makeAnalogIoValueRepository({
          findByBatchKey: vi.fn().mockResolvedValue([
            { ioIndex: 1, ioValue: 12.5, batchKey: 1001, logTime: new Date() },
          ]),
        }),
        digitalIoValueRepository: makeDigitalIoValueRepository({
          findByBatchKey: vi.fn().mockResolvedValue([
            { ioIndex: 2, ioValue: 1, batchKey: 1001, logTime: new Date() },
          ]),
        }),
      },
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        analogIoChangedEvent({ ioNum: 1, value: '12.5', type: TonelloIoType.AnalogInput, offsetSeconds: 10 }),
        digitalIoChangedEvent({ ioNum: 2, value: '1', type: TonelloIoType.DigitalInput, offsetSeconds: 15 }),
        batchEndEvent({ batchCode: 'ALPHA', offsetSeconds: 100 }),
      ),
    })

    await runPoll(ctx)

    expect(ctx.cradle.analogIoValueRepository.deleteByBatchKey).toHaveBeenCalledWith(
      1001,
      expect.anything(),
    )
    expect(ctx.cradle.digitalIoValueRepository.deleteByBatchKey).toHaveBeenCalledWith(
      1001,
      expect.anything(),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. BatchCancelledEvent
// ─────────────────────────────────────────────────────────────────────────────

describe('batchCancelledEvent', () => {
  it('sets cancelTime and cancelDetail, then finalizes', async () => {
    const ctx = await makeSession({
      events: events(batchStartEvent({ batchCode: 'ALPHA' }), batchCancelledEvent({ batchCode: 'ALPHA', offsetSeconds: 100 })),
    })

    await runPoll(ctx)

    expect(ctx.cradle.batchDataRepository.update).toHaveBeenCalledWith(
      1001,
      expect.objectContaining({ cancelTime: expect.any(Date), cancelDetail: 1, realDuration: 100 }),
      expect.anything(),
    )
    expect(ctx.session.runningBatchKey).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. CommandStartEvent / CommandFinishEvent
// ─────────────────────────────────────────────────────────────────────────────

describe('commandStartEvent / CommandFinishEvent', () => {
  it('inserts a BatchStep on command start', async () => {
    const ctx = await makeSession({
      events: events(batchStartEvent({ batchCode: 'ALPHA' }), commandStartEvent({ commandNum: 3, programNum: 101, programIndex: 2, stepNumAct: 10 })),
    })

    await runPoll(ctx)

    expect(ctx.cradle.batchStepRepository.insert).toHaveBeenCalledOnce()
    const stepArg = vi.mocked(ctx.cradle.batchStepRepository.insert).mock.calls[0][0]
    expect(stepArg.commandNo).toBe(3)
    expect(stepArg.programNo).toBe(101)
    expect(stepArg.programIndex).toBe(2)
    expect(stepArg.stepNo).toBe(10)
    expect(stepArg.parallelStepNo).toBe(0)
  })

  it('sets endTime on command finish using the composite key', async () => {
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        commandStartEvent({ commandNum: 3, programNum: 101, programIndex: 2, stepNumAct: 10 }),
        commandFinishEvent({ commandNum: 3, programNum: 101, programIndex: 2, stepNumAct: 20 }),
      ),
    })

    await runPoll(ctx)

    expect(ctx.cradle.batchStepRepository.setEndTime).toHaveBeenCalledOnce()
    const { batchKey, programNo, stepNo, parallelStepNo, commandNo } = vi.mocked(
      ctx.cradle.batchStepRepository.setEndTime,
    ).mock.calls[0][0]
    expect(batchKey).toBe(1001)
    expect(programNo).toBe(101)
    expect(stepNo).toBe(10)
    expect(parallelStepNo).toBe(0)
    expect(commandNo).toBe(3)
  })

  it('ignores CommandStartEvent when no active batch', async () => {
    const ctx = await makeSession({ events: events(commandStartEvent()) })

    await runPoll(ctx)

    expect(ctx.cradle.batchStepRepository.insert).not.toHaveBeenCalled()
  })

  it('ignores duplicate CommandStartEvent while a command is already running if it has same stepNumAct', async () => {
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        commandStartEvent({ commandNum: 3, programNum: 101, programIndex: 2, stepNumAct: 10 }),
        commandStartEvent({ commandNum: 4, programNum: 101, programIndex: 3, stepNumAct: 10 }), // second start without finish
      ),
    })

    await runPoll(ctx)

    // Only the first insert should happen
    expect(ctx.cradle.batchStepRepository.insert).toHaveBeenCalledTimes(1)
    const stepArg = vi.mocked(ctx.cradle.batchStepRepository.insert).mock.calls[0][0]
    expect(stepArg.commandNo).toBe(3)
  })

  it('auto-closes previous step and starts new one when CommandFinish was missed', async () => {
    const offset = 100
    const date = makeDate(offset)
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        commandStartEvent({ commandNum: 3, programNum: 101, programIndex: 2, stepNumAct: 10, offsetSeconds: offset - 50 }),
        commandStartEvent({ commandNum: 4, programNum: 101, programIndex: 3, stepNumAct: 15, offsetSeconds: offset }),
      ),
    })

    await runPoll(ctx)

    // Both of the commands should be inserted and first command should be finalized with endTime = start of second command
    expect(ctx.cradle.batchStepRepository.insert).toHaveBeenCalledTimes(2)
    expect(ctx.cradle.batchStepRepository.setEndTime).toHaveBeenCalledOnce()
    const firstStepArg = vi.mocked(ctx.cradle.batchStepRepository.insert).mock.calls[0][0]
    expect(firstStepArg.commandNo).toBe(3)
    const secondStepArg = vi.mocked(ctx.cradle.batchStepRepository.insert).mock.calls[1][0]
    expect(secondStepArg.commandNo).toBe(4)
    const endTimeArg = vi.mocked(ctx.cradle.batchStepRepository.setEndTime).mock.calls[0][1]
    expect(endTimeArg.getTime()).toBe(date.getTime())
  })

  it('logs a warning when CommandFinish commandNum does not match active step', async () => {
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        commandStartEvent({ commandNum: 3, programNum: 101, programIndex: 2, stepNumAct: 10 }),
        commandFinishEvent({ commandNum: 99, programNum: 101, programIndex: 2, stepNumAct: 20 }), // mismatched commandNum
      ),
    })

    await runPoll(ctx)

    // Despite the mismatch, it should still close the active step
    expect(ctx.cradle.batchStepRepository.setEndTime).toHaveBeenCalledOnce()
  })

  it('closes open commands when batch ends', async () => {
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        commandStartEvent({ commandNum: 3, programNum: 101, programIndex: 2, stepNumAct: 10 }),
        batchEndEvent({ batchCode: 'ALPHA', offsetSeconds: 100 }), // ends without CommandFinish
      ),
    })

    await runPoll(ctx)

    expect(ctx.cradle.batchStepRepository.closeAllOpen).toHaveBeenCalledWith(
      1001,
      expect.any(Date),
      expect.anything(),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. ChemicalRequestEvent
// ─────────────────────────────────────────────────────────────────────────────

describe('chemicalRequestEvent', () => {
  it('inserts ChemicalRequest and ChemicalRequestString rows', async () => {
    const ctx = await makeSession({
      events: events(batchStartEvent({ batchCode: 'ALPHA' }), chemicalRequestEvent({ requestOrder: 1, batchCode: 'ALPHA', offsetSeconds: 15 })),
    })

    await runPoll(ctx)

    expect(ctx.cradle.chemicalRequestRepository.insert).toHaveBeenCalledOnce()
    expect(ctx.cradle.chemicalRequestStringRepository.insert).toHaveBeenCalledOnce()

    const reqArg = vi.mocked(ctx.cradle.chemicalRequestRepository.insert).mock.calls[0][0]
    expect(reqArg.batchKey).toBe(1001)
    expect(reqArg.requestOrderIndex).toBe(1)
    expect(reqArg.status).toBe(RequestStatus.New)

    const strArg = vi.mocked(ctx.cradle.chemicalRequestStringRepository.insert).mock.calls[0][0]
    expect(strArg.isRequest).toBe(true)
    expect(strArg.requestOrder).toBe(1)
  })

  it('is ignored when no active batch', async () => {
    const ctx = await makeSession({ events: events(chemicalRequestEvent()) })

    await runPoll(ctx)

    expect(ctx.cradle.chemicalRequestRepository.insert).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. IOValueChanged — analog
// ─────────────────────────────────────────────────────────────────────────────

describe('ioValueChanged — analog', () => {
  it('inserts an AnalogIoValue row for AnalogInput events', async () => {
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        analogIoChangedEvent({ ioNum: 3, value: '12.5', type: TonelloIoType.AnalogInput }),
      ),
    })

    await runPoll(ctx)

    expect(ctx.cradle.analogIoValueRepository.insert).toHaveBeenCalledOnce()
    const arg = vi.mocked(ctx.cradle.analogIoValueRepository.insert).mock.calls[0][0]
    expect(arg.ioIndex).toBe(3)
    expect(arg.ioValue).toBe(12.5)
    expect(arg.batchKey).toBe(1001)
  })

  it('does not insert analog values when no active batch', async () => {
    const ctx = await makeSession({
      events: events(analogIoChangedEvent({ ioNum: 3, value: '12.5', type: TonelloIoType.AnalogInput })),
    })

    await runPoll(ctx)

    expect(ctx.cradle.analogIoValueRepository.insert).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. IOValueChanged — digital batching
// ─────────────────────────────────────────────────────────────────────────────

describe('ioValueChanged — digital batching', () => {
  it('flushes a single DigitalIoValue row for a group of events with the same datetime', async () => {
    const sameOffset = 5
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        digitalIoChangedEvent({ ioNum: 1, value: '1', type: TonelloIoType.DigitalInput, offsetSeconds: sameOffset }),
        digitalIoChangedEvent({ ioNum: 2, value: '1', type: TonelloIoType.DigitalInput, offsetSeconds: sameOffset }),
        digitalIoChangedEvent({ ioNum: 3, value: '0', type: TonelloIoType.DigitalOutput, offsetSeconds: sameOffset }),
      ),
    })

    await runPoll(ctx)

    expect(ctx.cradle.digitalIoValueRepository.insert).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(ctx.cradle.digitalIoValueRepository.insert).mock.calls[0][0]
    expect(arg.diValues![0]).toBe(true)
    expect(arg.diValues![1]).toBe(true)
    expect(arg.doFuncValues![2]).toBe(false)
  })

  it('flushes separate DigitalIoValue rows for events with different datetimes', async () => {
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        digitalIoChangedEvent({ ioNum: 1, value: '1', type: TonelloIoType.DigitalInput, offsetSeconds: 5 }),
        digitalIoChangedEvent({ ioNum: 2, value: '1', type: TonelloIoType.DigitalInput, offsetSeconds: 10 }), // different time
      ),
    })

    await runPoll(ctx)

    expect(ctx.cradle.digitalIoValueRepository.insert).toHaveBeenCalledTimes(2)
  })

  it('accumulates state across polls — digital values persist in memory', async () => {
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        digitalIoChangedEvent({ ioNum: 6, value: '1', type: TonelloIoType.DigitalInput }),
      ),
    })

    await runPoll(ctx)

    // After first poll, index 5 should be true
    expect(ctx.session.currentDigitalInputValues[5]).toBe(true)

    // Second poll: reset index 5 back to 0
    ctx.tonelloApi.fetchEvents.mockResolvedValue({
      from: 0,
      events: events(
        // runPoll needs the last event to advance so it doesnt think it missed events
        digitalIoChangedEvent({ ioNum: 6, value: '1', type: TonelloIoType.DigitalInput }),
        digitalIoChangedEvent({ ioNum: 6, value: '0', type: TonelloIoType.DigitalInput, offsetSeconds: 15 }),
      ),
    })
    await runPoll(ctx)

    expect(ctx.session.currentDigitalInputValues[5]).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. Missed events recovery
// ─────────────────────────────────────────────────────────────────────────────

describe('missed events recovery', () => {
  it('sets skipUntilNextBatchStart and cancels active batch when ID gap detected', async () => {
    const prevBatch: BatchData = {
      batchKey: 500,
      jobOrder: 'PREV',
      machineId,
      machineCode: 'TEST-01',
      startTime: new Date('2026-04-04T06:00:00Z'),
      endTime: null,
      cancelTime: null,
    } as unknown as BatchData

    // Supply findByKey BEFORE init() so activeBatch is loaded when the session starts
    const ctx = await makeSession({
      status: { lastEventId: 100, lastEventDate: '2026-04-04', runningBatchKey: 500 },
      deps: {
        batchDataRepository: makeBatchDataRepository({
          findByKey: vi.fn().mockResolvedValue(prevBatch),
        }),
      },
    })

    // The first event id from fixture starts at 1 (resetIds was called in beforeEach)
    // We need a gap: lastEventId=100, first received=120
    const gappedEvent = { ...batchStartEvent({ batchCode: 'NEW', offsetSeconds: 200 }), id: 120 }
    ctx.tonelloApi.fetchEvents.mockResolvedValue({ from: 0, events: [gappedEvent] })

    await runPoll(ctx)

    // Should have cancelled the old batch (finalizeOnMissedEvents)
    expect(ctx.cradle.batchDataRepository.update).toHaveBeenCalledWith(
      500,
      expect.objectContaining({ cancelTime: expect.any(Date) }),
      expect.anything(),
    )
    expect(ctx.cradle.machineStatusRepository.update).toHaveBeenCalledWith(
      machineId,
      expect.objectContaining({ runningJobOrder: 'NEW' }),
      expect.anything(),
    )
    // The BatchStartEvent itself should still be processed (skipUntilNextBatchStart gets cleared by it)
    expect(ctx.cradle.batchDataRepository.insertAndReturn).toHaveBeenCalledOnce()
  })

  it('skips non-BatchStart events after gap is detected, then resumes on BatchStart', async () => {
    const ctx = await makeSession({
      status: { lastEventId: 50, lastEventDate: '2026-04-04' },
      events: [],
    })

    // Simulate a gap: event IDs jump from 50 to 80, with a CommandStart then a BatchStart
    const skippedCommand = { ...commandStartEvent(), id: 80 }
    const resumingBatch = { ...batchStartEvent({ batchCode: 'FRESH', offsetSeconds: 200 }), id: 81 }
    ctx.tonelloApi.fetchEvents.mockResolvedValue({
      from: 0,
      events: [skippedCommand, resumingBatch],
    })

    await runPoll(ctx)

    // CommandStart should have been skipped
    expect(ctx.cradle.batchStepRepository.insert).not.toHaveBeenCalled()
    // BatchStart should have been processed
    expect(ctx.cradle.batchDataRepository.insertAndReturn).toHaveBeenCalledOnce()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. fetchEvents failure handling
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchEvents failure', () => {
  it('sets connectionStatus to NotConnected and does not advance lastEventId', async () => {
    const ctx = await makeSession({ status: { lastEventId: 42, lastEventDate: '2026-04-04' } })
    ctx.tonelloApi.fetchEvents.mockRejectedValue(new Error('ETIMEDOUT'))

    await runPoll(ctx)

    expect(ctx.cradle.machineStatusRepository.update).toHaveBeenCalledWith(
      machineId,
      expect.objectContaining({ connectionStatus: ConnectionStatus.NotConnected }),
      // No transaction — direct update
    )
    // Transaction should NOT have been started
    expect(ctx.cradle.teleskop.transaction).not.toHaveBeenCalled()
  })

  it('recovers to Connected on next successful poll', async () => {
    const ctx = await makeSession({ status: { connectionStatus: ConnectionStatus.NotConnected } })
    ctx.tonelloApi.fetchEvents.mockResolvedValue({ from: 0, events: [] })

    await runPoll(ctx)

    expect(ctx.cradle.machineStatusRepository.update).toHaveBeenCalledWith(
      machineId,
      expect.objectContaining({ connectionStatus: ConnectionStatus.Connected }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 10. Chemical request response routing
// ─────────────────────────────────────────────────────────────────────────────

describe('chemical request response routing', () => {
  it('sends the response back to the machine API for a known pending request', async () => {
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        chemicalRequestEvent({ requestOrder: 1, batchCode: 'ALPHA', offsetSeconds: 15 })
      ),
    })

    await runPoll(ctx)

    const batchKey = ctx.session.runningBatchKey!

    await ctx.session.handleChemicalRequestResponses([
      {
        id: 99,
        batchKey,
        parsed: makeChemicalResponse({ status: RequestStatus.Completed }),
      },
    ])

    expect(ctx.tonelloApi.submitChemicalRequestStatus).toHaveBeenCalledOnce()
    const callArg = vi.mocked(ctx.tonelloApi.submitChemicalRequestStatus).mock.calls[0][0]
    expect(callArg.state).toBe(TonelloChemicalRequestStatus.Done)
    expect(callArg.message).toBe('')

    expect(ctx.cradle.chemicalRequestRepository.updateStatus).toHaveBeenCalledWith(1, RequestStatus.Completed)
  })

  it('sets message and Error state for a Cancelled request', async () => {
    const ctx = await makeSession({
      events: events(batchStartEvent({ batchCode: 'ALPHA' }), chemicalRequestEvent({ requestOrder: 1, batchCode: 'ALPHA', offsetSeconds: 15 })),
    })

    await runPoll(ctx)

    const batchKey = ctx.session.runningBatchKey!

    await ctx.session.handleChemicalRequestResponses([
      {
        id: 100,
        batchKey,
        parsed: makeChemicalResponse({ status: RequestStatus.Cancelled }),
      },
    ])

    const callArg = vi.mocked(ctx.tonelloApi.submitChemicalRequestStatus).mock.calls[0][0]
    expect(callArg.state).toBe(TonelloChemicalRequestStatus.Error)
    expect(callArg.message).not.toBe('')

    expect(ctx.cradle.chemicalRequestRepository.updateStatus).toHaveBeenCalledWith(1, RequestStatus.Cancelled)
  })

  it('skips responses for unknown request keys and does not crash', async () => {
    const ctx = await makeSession({ events: events(batchStartEvent({ batchCode: 'ALPHA', offsetSeconds: 0 })) })
    await runPoll(ctx)

    await expect(
      ctx.session.handleChemicalRequestResponses([
        {
          id: 50,
          batchKey: 1001,
          parsed: makeChemicalResponse({ status: RequestStatus.Completed, requestOrder: 99, totalRequests: 1 }),
        },
      ]),
    ).resolves.not.toThrow()

    expect(ctx.tonelloApi.submitChemicalRequestStatus).not.toHaveBeenCalled()
  })

  it('removes the request from the pending map after a terminal response', async () => {
    const ctx = await makeSession({
      events: events(batchStartEvent({ batchCode: 'ALPHA' }), chemicalRequestEvent({ requestOrder: 1, batchCode: 'ALPHA', offsetSeconds: 15 })),
    })
    await runPoll(ctx)

    const batchKey = ctx.session.runningBatchKey!

    await ctx.session.handleChemicalRequestResponses([
      {
        id: 99,
        batchKey,
        parsed: makeChemicalResponse({ status: RequestStatus.Completed }),
      },
    ])

    // Second response for the same request should be skipped
    vi.mocked(ctx.tonelloApi.submitChemicalRequestStatus).mockClear()
    await ctx.session.handleChemicalRequestResponses([
      {
        id: 100,
        batchKey,
        parsed: makeChemicalResponse({ status: RequestStatus.Completed }),
      },
    ])

    expect(ctx.tonelloApi.submitChemicalRequestStatus).not.toHaveBeenCalled()
  })

  it('keeps the request in the pending map after a non-terminal response', async () => {
    const ctx = await makeSession({
      events: events(batchStartEvent({ batchCode: 'ALPHA' }), chemicalRequestEvent({ requestOrder: 1, batchCode: 'ALPHA', offsetSeconds: 15 })),
    })
    await runPoll(ctx)

    const batchKey = ctx.session.runningBatchKey!

    await ctx.session.handleChemicalRequestResponses([
      {
        id: 99,
        batchKey,
        parsed: makeChemicalResponse({ status: RequestStatus.Started }),
      },
    ])

    expect(ctx.cradle.chemicalRequestRepository.updateStatus).toHaveBeenCalledWith(1, RequestStatus.Started)

    // Second response for the same request should still be processed
    vi.mocked(ctx.tonelloApi.submitChemicalRequestStatus).mockClear()
    vi.mocked(ctx.cradle.chemicalRequestRepository.updateStatus).mockClear()
    await ctx.session.handleChemicalRequestResponses([
      {
        id: 100,
        batchKey,
        parsed: makeChemicalResponse({ status: RequestStatus.Completed }),
      },
    ])

    expect(ctx.tonelloApi.submitChemicalRequestStatus).toHaveBeenCalledOnce()
    expect(ctx.cradle.chemicalRequestRepository.updateStatus).toHaveBeenCalledWith(1, RequestStatus.Completed)
  })

  it('routes Dye requests using batch-scoped requestOrder and totalRequests', async () => {
    // Dye requests: the response must carry the raw batch-scoped values from the event.
    const ctx = await makeSession({
      events: events(
        batchStartEvent({ batchCode: 'ALPHA' }),
        chemicalRequestEvent({ requestOrder: 2, batchCode: 'ALPHA', batchTotRequestCount: 5 }),
      ),
    })
    await runPoll(ctx)

    const batchKey = ctx.session.runningBatchKey!

    // A response with the correct batch-scoped values (requestOrder=2, totalRequests=5) must match.
    await ctx.session.handleChemicalRequestResponses([{
      id: 99,
      batchKey,
      parsed: makeChemicalResponse({ status: RequestStatus.Completed, requestOrder: 2, totalRequests: 5 }),
    }])

    expect(ctx.tonelloApi.submitChemicalRequestStatus).toHaveBeenCalledOnce()
  })

  it('routes Chemical requests using program-scoped requestOrder and totalRequests', async () => {
    // Chemical requests: the response must carry the program-scoped values derived by extendChemicalRequestEvent.
    // Set up the batch with one program so extendChemicalRequestEvent can compute the program-scoped values.
    const ctx = await makeSession({
      events: events(
        // TODO: Create multi program batch test
        batchStartEvent({ batchCode: 'ALPHA', programList: ['100'] }),
        chemicalRequestEvent({
          requestOrder: 1,
          batchCode: 'ALPHA',
          requestType: TonelloChemicalRequestType.Chemical,
        }),
      ),
      deps: {
        programHeaderRepository: makeProgramHeaderRepository({
          findByMachineAndProgramNo: vi.fn().mockResolvedValue({
            programNo: 100,
            name: 'MockProgram',
            autoChemReq: 2,
            autoDyeReq: 0,
          }),
        }),
      },
    })
    await runPoll(ctx)

    const batchKey = ctx.session.runningBatchKey!

    // A response with program-scoped values (requestOrder=1, totalRequests=2, Chemical type) must match.
    await ctx.session.handleChemicalRequestResponses([{
      id: 99,
      batchKey,
      parsed: makeChemicalResponse({
        status: RequestStatus.Completed,
        materialType: MaterialType.Chemical,
        requestOrder: 1,
        totalRequests: 2,
      }),
    }])

    expect(ctx.tonelloApi.submitChemicalRequestStatus).toHaveBeenCalledOnce()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 11. MachineSession initialization from existing DB state
// ─────────────────────────────────────────────────────────────────────────────

describe('machineSession initialization', () => {
  it('resumes from lastEventId and lastEventDate when status row exists', async () => {
    const ctx = await makeSession({
      status: { lastEventId: 200, lastEventDate: '2026-04-02' },
    })

    expect(vi.mocked(ctx.cradle.machineStatusRepository.findByMachineId)).toHaveBeenCalledWith(machineId)

    // On next poll, fetchEvents should be called with the resumed position
    ctx.tonelloApi.fetchEvents.mockResolvedValue({ from: 0, events: [] })
    await runPoll(ctx)

    expect(ctx.tonelloApi.fetchEvents).toHaveBeenCalledWith('2026-04-02', 200)
  })

  it('starts from today with from=0 when no previous state exists', async () => {
    const ctx = await makeSession({ status: { lastEventId: null, lastEventDate: null } })

    ctx.tonelloApi.fetchEvents.mockResolvedValue({ from: 0, events: [] })
    await runPoll(ctx)

    const [dateArg, fromArg] = ctx.tonelloApi.fetchEvents.mock.calls[0]
    expect(fromArg).toBe(0)
    // Date should be today's date string
    const today = new Date().toISOString().slice(0, 10)
    expect(dateArg).toBe(today)
  })

  it('throws during init when MachineStatus row is not found', async () => {
    const { cradle } = makeTestContainer({
      machineStatusRepository: makeMachineStatusRepository({
        findByMachineId: vi.fn().mockResolvedValue(undefined),
      }),
    })
    const session = new MachineSession(makeMachine(), pino({ level: 'silent' }), cradle)

    await expect(session.init()).rejects.toThrow('MachineStatus row not found')
  })

  it('loads active batch from DB when runningBatchKey is set in status', async () => {
    const existingBatch: BatchData = {
      batchKey: 777,
      jobOrder: 'RESUMED',
      machineId,
      machineCode: 'TEST-01',
      startTime: new Date('2026-04-04T07:00:00Z'),
      endTime: null,
      cancelTime: null,
    } as unknown as BatchData

    // Supply findByKey BEFORE init() so activeBatch is loaded from DB at startup
    const ctx = await makeSession({
      status: { runningBatchKey: 777 },
      events: events(batchEndEvent({ batchCode: 'RESUMED', offsetSeconds: 100 })),
      deps: {
        batchDataRepository: makeBatchDataRepository({
          findByKey: vi.fn().mockResolvedValue(existingBatch),
        }),
      },
    })

    await runPoll(ctx)

    expect(ctx.cradle.batchDataRepository.update).toHaveBeenCalledWith(
      777,
      expect.objectContaining({ endTime: expect.any(Date) }),
      expect.anything(),
    )
  })

  it('restores pending chemical requests from DB when resuming an active batch', async () => {
    const existingBatch: BatchData = {
      batchKey: 777,
      jobOrder: 'RESUMED',
      machineId,
      machineCode: 'TEST-01',
      startTime: new Date('2026-04-04T07:00:00Z'),
      endTime: null,
      cancelTime: null,
    } as unknown as BatchData

    const requestEvent = chemicalRequestEvent({ requestOrder: 1, batchCode: 'RESUMED', offsetSeconds: 15 })
    const ctx = await makeSession({
      status: { runningBatchKey: 777 },
      deps: {
        batchDataRepository: makeBatchDataRepository({
          findByKey: vi.fn().mockResolvedValue(existingBatch),
        }),
        chemicalRequestRepository: makeChemicalRequestRepository({
          findByBatchKey: vi.fn().mockResolvedValue([
            {
              id: 55,
              batchKey: 777,
              requestTime: new Date(),
              jobOrder: 'RESUMED',
              recipeIndex: 0,
              requestOrderIndex: 1,
              operationCode: 42,
              targetRecipe: 0,
              tankNo: 7,
              priority: 50,
              totalRequestsInProgram: 3,
              programNo: 100,
              commandNo: 1,
              status: RequestStatus.New,
              tonelloEvent: requestEvent
            },
          ]),
        }),
      },
    })

    // Should be able to route a response for the restored request
    await ctx.session.handleChemicalRequestResponses([
      {
        id: 50,
        batchKey: 777,
        parsed: makeChemicalResponse({ status: RequestStatus.Completed, jobOrder: 'RESUMED' }),
      },
    ])

    expect(ctx.tonelloApi.submitChemicalRequestStatus).toHaveBeenCalledOnce()
    expect(ctx.cradle.chemicalRequestRepository.updateStatus).toHaveBeenCalledWith(55, RequestStatus.Completed)
  })

  it('skips completed and cancelled chemical requests when restoring from DB', async () => {
    const existingBatch: BatchData = {
      batchKey: 777,
      jobOrder: 'RESUMED',
      machineId,
      machineCode: 'TEST-01',
      startTime: new Date('2026-04-04T07:00:00Z'),
      endTime: null,
      cancelTime: null,
    } as unknown as BatchData

    const requestEvent = chemicalRequestEvent({ requestOrder: 1, batchCode: 'RESUMED', offsetSeconds: 15 })
    const ctx = await makeSession({
      status: { runningBatchKey: 777 },
      deps: {
        batchDataRepository: makeBatchDataRepository({
          findByKey: vi.fn().mockResolvedValue(existingBatch),
        }),
        chemicalRequestRepository: makeChemicalRequestRepository({
          findByBatchKey: vi.fn().mockResolvedValue([
            {
              id: 1,
              batchKey: 777,
              requestTime: new Date(),
              jobOrder: 'RESUMED',
              recipeIndex: 0,
              requestOrderIndex: 1,
              operationCode: 42,
              targetRecipe: 0,
              tankNo: 7,
              priority: 50,
              totalRequestsInProgram: 1,
              programNo: 100,
              commandNo: 1,
              status: RequestStatus.Completed,
              tonelloEvent: requestEvent,
            },
            {
              id: 2,
              batchKey: 777,
              requestTime: new Date(),
              jobOrder: 'RESUMED',
              recipeIndex: 0,
              requestOrderIndex: 2,
              operationCode: 42,
              targetRecipe: 0,
              tankNo: 7,
              priority: 50,
              totalRequestsInProgram: 1,
              programNo: 100,
              commandNo: 1,
              status: RequestStatus.Cancelled,
              tonelloEvent: requestEvent,
            },
          ]),
        }),
      },
    })

    // Responses for skipped requests should not be routed
    await ctx.session.handleChemicalRequestResponses([
      {
        id: 50,
        batchKey: 777,
        parsed: makeChemicalResponse({ status: RequestStatus.Completed, jobOrder: 'RESUMED', totalRequests: 1 }),
      },
    ])

    expect(ctx.tonelloApi.submitChemicalRequestStatus).not.toHaveBeenCalled()
  })

  it('handles missing tonelloEvent gracefully when restoring pending requests', async () => {
    const existingBatch: BatchData = {
      batchKey: 777,
      jobOrder: 'RESUMED',
      machineId,
      machineCode: 'TEST-01',
      startTime: new Date('2026-04-04T07:00:00Z'),
      endTime: null,
      cancelTime: null,
    } as unknown as BatchData

    const ctx = await makeSession({
      status: { runningBatchKey: 777 },
      deps: {
        batchDataRepository: makeBatchDataRepository({
          findByKey: vi.fn().mockResolvedValue(existingBatch),
        }),
        chemicalRequestRepository: makeChemicalRequestRepository({
          findByBatchKey: vi.fn().mockResolvedValue([
            {
              id: 1,
              batchKey: 777,
              requestTime: new Date(),
              jobOrder: 'RESUMED',
              recipeIndex: 0,
              requestOrderIndex: 1,
              operationCode: 42,
              targetRecipe: 0,
              tankNo: 7,
              priority: 50,
              totalRequestsInProgram: 1,
              programNo: 100,
              commandNo: 1,
              status: RequestStatus.New,
              tonelloEvent: null,
            },
          ]),
        }),
      },
    })

    // Should not throw and should not route responses
    await ctx.session.handleChemicalRequestResponses([
      {
        id: 50,
        batchKey: 777,
        parsed: makeChemicalResponse({ status: RequestStatus.Completed, jobOrder: 'RESUMED', totalRequests: 1 }),
      },
    ])

    expect(ctx.tonelloApi.submitChemicalRequestStatus).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12. Transaction commit/rollback
// ─────────────────────────────────────────────────────────────────────────────

describe('transaction handling', () => {
  it('commits the transaction after a successful event batch', async () => {
    const ctx = await makeSession({ events: events(batchStartEvent({ batchCode: 'ALPHA' })) })

    await runPoll(ctx)

    expect(ctx.trx.commit).toHaveBeenCalledOnce()
    expect(ctx.trx.rollback).not.toHaveBeenCalled()
  })

  it('rolls back the transaction when a repository throws', async () => {
    const ctx = await makeSession({ events: events(batchStartEvent({ batchCode: 'ALPHA' })) })
    vi.mocked(ctx.cradle.batchDataRepository.insertAndReturn).mockRejectedValue(
      new Error('DB error'),
    )

    await runPoll(ctx)

    expect(ctx.trx.rollback).toHaveBeenCalledOnce()
    expect(ctx.trx.commit).not.toHaveBeenCalled()
  })
})
