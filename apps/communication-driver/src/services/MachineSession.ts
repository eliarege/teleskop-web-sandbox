import { Buffer } from 'node:buffer'
import { gzipSync } from 'node:zlib'
import {
  TonelloApi,
  TonelloChemicalRequestStatus,
  TonelloEventCode,
  TonelloIoType,
} from '@teleskop/core'
import type {
  TonelloBatchCancelledEvent,
  TonelloBatchEndEvent,
  TonelloBatchStartEvent,
  TonelloChemicalRequestEvent,
  TonelloCommandFinishEvent,
  TonelloCommandStartEvent,
  TonelloEvent,
  TonelloIoValueChangedEvent,
} from '@teleskop/core'
import type { Knex } from 'knex'
import type { Logger } from 'pino'
import {
  BatchStartEndState,
  BatchStatus,
  CancelDetail,
  ConnectionStatus,
  RequestStatus,
  RequestType,
} from '../db/enums'
import type {
  AnalogIoValue,
  BatchData,
  BatchDataInsert,
  BatchDataUpdate,
  BatchStepInsert,
  ChemicalRequestStringResponseParsed,
  DigitalIoValue,
  Machine,
  MachineStatus,
} from '../db/models'
import type { AnalogIoValueRepository } from '../db/repositories/AnalogIoValueRepository'
import type { BatchDataRepository } from '../db/repositories/BatchDataRepository'
import type { BatchPlanRepository } from '../db/repositories/BatchPlanRepository'
import type { BatchStartEndRepository } from '../db/repositories/BatchStartEndRepository'
import type { BatchStepRepository } from '../db/repositories/BatchStepRepository'
import type { BatchStopRepository } from '../db/repositories/BatchStopRepository'
import type { ChemicalRequestRepository } from '../db/repositories/ChemicalRequestRepository'
import type { ChemicalRequestStringRepository } from '../db/repositories/ChemicalRequestStringRepository'
import type { CommandRepository } from '../db/repositories/CommandRepository'
import type { DigitalIoValueRepository } from '../db/repositories/DigitalIoValueRepository'
import type { MachineStatusRepository } from '../db/repositories/MachineStatusRepository'
import type { BatchDataFilesRepository } from '../db/repositories/BatchDataFilesRepository'
import type { ProgramHeaderRepository } from '../db/repositories/ProgramHeaderRepository'
import {
  diffInSeconds,
  extractDateString,
  mapRequestStatusToTonello,
  mapTonelloChemicalRequestType,
  mapTonelloIoType,
} from '../utils'
import type { PlanningBoardService } from './PlanningBoardService'

const DIGITAL_IO_ARRAY_SIZE = 64
/** Default stop reason placeholder for Tonello machines (they do not report stop reasons). */
const DEFAULT_STOP_REASON = 0

type PostCommitAction =
  | {
    type: 'addNote'
    batchCode: string
    message: string
  }
  | {
    type: 'unplanBatch'
    planKey: number
  }

export interface MachineSessionDeps {
  teleskop: Knex
  digitalIoFlushInterval: number
  machineStatusRepository: MachineStatusRepository
  batchDataRepository: BatchDataRepository
  batchStepRepository: BatchStepRepository
  batchStopRepository: BatchStopRepository
  batchStartEndRepository: BatchStartEndRepository
  analogIoValueRepository: AnalogIoValueRepository
  digitalIoValueRepository: DigitalIoValueRepository
  batchDataFilesRepository: BatchDataFilesRepository
  chemicalRequestRepository: ChemicalRequestRepository
  chemicalRequestStringRepository: ChemicalRequestStringRepository
  batchPlanRepository: BatchPlanRepository
  commandRepository: CommandRepository
  programHeaderRepository: ProgramHeaderRepository
  planningBoardService: PlanningBoardService
}

export class MachineSession {
  private readonly api: TonelloApi
  private status!: MachineStatus
  private activeBatch: BatchData | null = null
  private activeStep: BatchStepInsert | null = null
  private activeProgramIndex: number | null = null

  readonly currentDigitalInputValues: boolean[] = Array.from<boolean>({
    length: DIGITAL_IO_ARRAY_SIZE,
  }).fill(false)

  readonly currentDigitalOutputValues: boolean[] = Array.from<boolean>({
    length: DIGITAL_IO_ARRAY_SIZE,
  }).fill(false)

  /** In-memory map of pending chemical requests, keyed by `${batchKey}:${requestOrderIndex}`. */
  private readonly pendingChemicalRequests = new Map<string, TonelloChemicalRequestEvent>()

  /** When true, all events are skipped until the next `BatchStartEvent` (missed-event recovery). */
  private skipUntilNextBatchStart = false

  private pollingTimer: ReturnType<typeof setTimeout> | null = null
  private pollingInterval = 0

  constructor(
    readonly machine: Machine,
    private readonly logger: Logger,
    private readonly deps: MachineSessionDeps,
  ) {
    this.api = TonelloApi.createFromHostname(machine.ipAddress)
  }

  get machineId(): number {
    return this.machine.machineId
  }

  /** The batchKey of the currently running batch, or null if idle. */
  get runningBatchKey(): number | null {
    return this.activeBatch?.batchKey ?? null
  }

  /** Restores session state from the database. Must be called before `startPolling`. */
  async init(): Promise<void> {
    const status = await this.deps.machineStatusRepository.findByMachineId(this.machine.machineId)
    if (!status) {
      throw new Error(
        `MachineStatus row not found for machine ${this.machine.machineId} - ensure ensureExists was called`,
      )
    }
    this.status = status

    if (status.runningBatchKey !== null) {
      this.activeBatch = (await this.deps.batchDataRepository.findByKey(status.runningBatchKey)) ?? null
      if (!this.activeBatch) {
        this.logger.warn(
          { machineId: this.machineId },
          'runningBatchKey set in status but BatchData not found, clearing',
        )
        this.status.runningBatchKey = null
      }
    }

    this.logger.info(
      {
        machineId: this.machineId,
        lastEventId: status.lastEventId,
        lastEventDate: status.lastEventDate,
      },
      'MachineSession initialized',
    )
  }

  startPolling(interval: number, jitter = true): void {
    this.pollingInterval = interval
    const delay = jitter ? Math.random() * interval : 0
    this.pollingTimer = setTimeout(() => void this.runPollLoop(), delay)
  }

  stopPolling(): void {
    if (this.pollingTimer !== null) {
      clearTimeout(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  private async runPollLoop(): Promise<void> {
    if (this.pollingTimer === null)
      return
    await this.poll()
    if (this.pollingTimer !== null)
      this.pollingTimer = setTimeout(() => void this.runPollLoop(), this.pollingInterval)
  }

  // ── Poll ────────────────────────────────────────────────────────────────────

  private async poll(): Promise<void> {
    const lastDate = this.status.lastEventDate ?? extractDateString(new Date())
    const lastId = this.status.lastEventId ?? 0

    let fetchResult: { from: number, events: TonelloEvent[] }
    try {
      fetchResult = await this.api.fetchEvents(lastDate, lastId)
    } catch (err) {
      this.logger.warn(
        { machineId: this.machineId }, 
        'Failed to fetch events from machine: %s', (err as Error)?.message || 'Unknown error'
      )
      await this.deps.machineStatusRepository.update(this.machineId, {
        connectionStatus: ConnectionStatus.NotConnected,
      })
      this.status.connectionStatus = ConnectionStatus.NotConnected
      return
    }

    const { events } = fetchResult
    const wasDisconnected = this.status.connectionStatus !== ConnectionStatus.Connected

    if (events.length === 0) {
      if (wasDisconnected) {
        await this.deps.machineStatusRepository.update(this.machineId, {
          connectionStatus: ConnectionStatus.Connected,
        })
        this.status.connectionStatus = ConnectionStatus.Connected
      }
      return
    }

    // We should skip the first event if we are not in missed-event recovery mode
    // and this is not our first time fetching events (lastId > 0).
    // Detect this before opening a transaction to avoid leaking connections.
    const firstEventId = events[0].id
    const hasMissedEvents = lastId > 0 && firstEventId > lastId + 1
    const skipFirstEvent = !this.skipUntilNextBatchStart && !hasMissedEvents && lastId > 0

    if (skipFirstEvent && events.length === 1) {
      return
    }
    // TODO: What isolation level?
    const trx = await this.deps.teleskop.transaction()
    const postCommitActions: PostCommitAction[] = []
    try {
      // Detect missed events - if the first returned event skips ahead in ID space
      if (hasMissedEvents) {
        this.logger.warn(
          { machineId: this.machineId, expectedId: lastId + 1, receivedId: firstEventId },
          'Missed events detected - skipping to next BatchStartEvent',
        )
        await this.finalizeOnMissedEvents(events[0].datetime, trx)
        this.skipUntilNextBatchStart = true
      }

      await this.processBatch(skipFirstEvent ? events.slice(1) : events, postCommitActions, trx)

      const lastEvent = events[events.length - 1]
      this.status.lastEventId = lastEvent.id
      this.status.lastEventDate = extractDateString(lastEvent.datetime)
      this.status.connectionStatus = ConnectionStatus.Connected

      await this.deps.machineStatusRepository.update(this.machineId, this.status, trx)
      await trx.commit()
      for (const action of postCommitActions) {
        switch (action.type) {
          case 'addNote':
            await this.deps.planningBoardService.addBatchNote(action.batchCode, action.message)
            break
          case 'unplanBatch':
            await this.deps.planningBoardService.unplanBatch(action.planKey)
            break
        }
      }
    } catch (err) {
      await trx.rollback()
      this.logger.error(
        { err, machineId: this.machineId },
        'Error processing event batch - transaction rolled back',
      )
    }
  }

  // ── Event batch processing ──────────────────────────────────────────────────

  private async processBatch(
    events: TonelloEvent[],
    postCommitActions: PostCommitAction[],
    trx: Knex.Transaction,
  ): Promise<void> {
    let pendingDigitalDatetime: number | null = null
    this.logger.debug({ machineId: this.machineId, eventCount: events.length }, 'Processing event batch')

    for (const event of events) {
      if (event.eventValue === TonelloEventCode.IoValueChangedEvent) {
        // Flush the previous digital batch if the timestamp difference exceeds the configured interval.
        const ts = event.datetime.getTime()
        if (
          pendingDigitalDatetime !== null
          && ts !== pendingDigitalDatetime
          && ts - pendingDigitalDatetime >= this.deps.digitalIoFlushInterval
        ) {
          await this.flushDigitalBatch(new Date(pendingDigitalDatetime), trx)
          pendingDigitalDatetime = null
        }
        const ioEvent = event as TonelloIoValueChangedEvent
        const isDigital
          = ioEvent.ioType === TonelloIoType.DigitalInput
          || ioEvent.ioType === TonelloIoType.DigitalOutput

        if (isDigital) {
          pendingDigitalDatetime = ts
          const idx = Number.parseInt(ioEvent.ioNum) - 1
          if (ioEvent.ioType === TonelloIoType.DigitalInput) {
            this.currentDigitalInputValues[idx] = ioEvent.value === '1'
          } else {
            this.currentDigitalOutputValues[idx] = ioEvent.value === '1'
          }
        } else {
          await this.handleAnalogIoValue(ioEvent, trx)
        }
      } else {
        // Flush on non-IO event if we have pending digital IO values to ensure correct ordering of events in the database.
        if (pendingDigitalDatetime !== null) {
          await this.flushDigitalBatch(new Date(pendingDigitalDatetime), trx)
          pendingDigitalDatetime = null
        }
        await this.processEvent(event, postCommitActions, trx)
      }
    }
    // Flush any remaining digital IO values after processing the batch.
    if (pendingDigitalDatetime !== null) {
      await this.flushDigitalBatch(new Date(pendingDigitalDatetime), trx)
    }
  }

  private async processEvent(
    event: TonelloEvent,
    postCommitActions: PostCommitAction[],
    trx: Knex.Transaction,
  ): Promise<void> {
    if (this.skipUntilNextBatchStart && event.eventValue !== TonelloEventCode.BatchStartEvent) {
      this.logger.debug(
        { machineId: this.machineId, eventId: event.id, eventValue: event.eventValue },
        'Skipping event - waiting for BatchStartEvent',
      )
      return
    }

    switch (event.eventValue) {
      case TonelloEventCode.BatchStartEvent:
        await this.handleBatchStart(event, postCommitActions, trx)
        break
      case TonelloEventCode.BatchEndEvent:
        await this.handleBatchEnd(event, postCommitActions, trx)
        break
      case TonelloEventCode.BatchCancelledEvent:
        await this.handleBatchCancelled(event, postCommitActions, trx)
        break
      case TonelloEventCode.CommandStartEvent:
        await this.handleCommandStart(event, trx)
        break
      case TonelloEventCode.CommandFinishEvent:
        await this.handleCommandFinish(event, trx)
        break
      case TonelloEventCode.ChemicalRequestEvent:
        await this.handleChemicalRequest(event, trx)
        break
      case TonelloEventCode.BatchContinueEvent:
      case TonelloEventCode.BatchStoppedEvent:
        break
      default:
        this.logger.debug(
          { machineId: this.machineId, eventValue: event.eventValue },
          'Unhandled event type - ignoring',
        )
    }
  }

  // ── BatchStart ──────────────────────────────────────────────────────────────

  private async handleBatchStart(
    event: TonelloBatchStartEvent,
    postCommitActions: PostCommitAction[],
    trx: Knex.Transaction,
  ): Promise<void> {
    // Duplicate detection: same batch already running and not in recovery mode
    if (
      !this.skipUntilNextBatchStart
      && this.activeBatch !== null
      && this.activeBatch.jobOrder === event.batchCode
    ) {
      this.logger.warn(
        { machineId: this.machineId, batchCode: event.batchCode, eventId: event.id },
        'Duplicate BatchStartEvent received - ignoring',
      )
      return
    }

    // Clear recovery flag
    this.skipUntilNextBatchStart = false

    // Force-cancel any uncompleted previous batch (missed end event)
    if (
      this.activeBatch !== null
      && this.activeBatch.endTime === null
      && this.activeBatch.cancelTime === null
    ) {
      this.logger.warn(
        { machineId: this.machineId, prevBatchKey: this.activeBatch.batchKey },
        'Previous batch was not completed - force-cancelling before new batch start',
      )
      await this.deps.batchDataRepository.update(
        this.activeBatch.batchKey,
        { cancelTime: event.datetime },
        trx,
      )
      await this.deps.batchStepRepository.closeAllOpen(
        this.activeBatch.batchKey,
        event.datetime,
        trx,
      )
      this.activeBatch = null
      this.activeProgramIndex = null
    }

    // 1. Look up planned batch
    const plannedBatch = await this.deps.batchPlanRepository.findLatestByJobOrder(event.batchCode)

    const batchReference = await this.deps.batchDataRepository.getNextBatchReference(
      event.datetime,
      this.machineId,
      trx,
    )

    // 2. Insert batch record
    const batchInsert: BatchDataInsert = {
      batchReference,
      machineId: this.machineId,
      machineCode: this.machine.machineCode,
      jobOrder: event.batchCode,
      startTime: event.datetime,
      programCount: event.programList.length,
      programNoList: event.programList.map(Number),
      isCorrection: false,
      archived: false,
      plannedMachineId: plannedBatch?.plannedMachine,
      fabricWeight: event.weight,
      theoreticalDuration: 0,
      operatorCode: event.operator,
      planKey: plannedBatch?.planKey ?? -1,
      operatorName: 'Operator',
      customerName: 'Customer',
      partyNumber: 'Party',
    }

    this.activeBatch = await this.deps.batchDataRepository.insertAndReturn(batchInsert, trx)
    const newBatchKey = this.activeBatch.batchKey

    // 4. Update in-memory status
    this.status.runningJobOrder = event.batchCode
    this.status.runningJobOrderStartTime = event.datetime
    this.status.runningBatchKey = newBatchKey
    this.status.runningBatchStatus = BatchStatus.Running
    this.status.runningProgramNo = 0
    // We update at `CommandStart` since its also handles program changes within a batch
    this.status.runningProgramName = ''
    this.status.runningProgramNoList = event.programList.map(Number)
    this.status.runningStepNo = -1
    this.status.runningCommandNo = 0
    this.status.runningCommandName = ''
    this.status.runningOperatorNo = event.operator
    this.status.runningOperatorName = 'Operator'
    this.status.runningTheoreticalTime = 0
    this.status.runningAlarmNo = 0
    this.status.runningAlarmName = ''
    this.status.stopReason = ''
    this.status.stopReasonDateTime = null
    this.status.manualReason = ''
    this.status.manualReasonDateTime = null
    this.status.lastEventId = event.id
    this.status.lastEventDate = extractDateString(event.datetime)

    // 5 & 6. Notify planning board
    if (plannedBatch) {
      postCommitActions.push({
        type: 'unplanBatch',
        planKey: plannedBatch.planKey,
      })
    }
    postCommitActions.push({
      type: 'addNote',
      batchCode: event.batchCode,
      message: `Batch was started by operator ${this.status.runningOperatorName}`,
    })

    // 7. Insert BatchStartEnd record
    await this.deps.batchStartEndRepository.insert(
      {
        jobOrder: event.batchCode,
        machineId: this.machineId,
        state: BatchStartEndState.Start,
        date: event.datetime,
        programNoList: this.status.runningProgramNoList,
        totalRequestCount: 0,
      },
      trx,
    )

    // 8. Close the open stop from the previous batch/idle period
    await this.deps.batchStopRepository.closeLatestOpenForMachine(
      this.machineId,
      event.datetime,
      trx,
    )
  }

  // ── BatchEnd / BatchCancelled ───────────────────────────────────────────────

  private async handleBatchEnd(
    event: TonelloBatchEndEvent,
    postCommitActions: PostCommitAction[],
    trx: Knex.Transaction,
  ): Promise<void> {
    if (this.activeBatch === null) {
      this.logger.warn(
        { machineId: this.machineId, batchCode: event.batchCode, eventId: event.id },
        'BatchEndEvent received with no active batch - ignoring',
      )
      return
    }

    const endTime = event.datetime
    const updates: BatchDataUpdate = {
      endTime,
      realDuration: diffInSeconds(endTime, this.activeBatch.startTime),
      actualTheoreticalDuration: 0,
      deviation: 0,
    }
    // Setting endTime will delete IO values due to triggers, so we need to move them to batch files first
    await this.moveIoValuesToBatchFiles(this.activeBatch.batchKey, trx)
    await this.deps.batchDataRepository.update(this.activeBatch.batchKey, updates, trx)
    await this.finalizeBatch(event.batchCode, endTime, trx)

    postCommitActions.push({
      type: 'addNote',
      batchCode: event.batchCode,
      message: 'Batch was completed',
    })
  }

  private async handleBatchCancelled(
    event: TonelloBatchCancelledEvent,
    postCommitActions: PostCommitAction[],
    trx: Knex.Transaction,
  ): Promise<void> {
    if (this.activeBatch === null) {
      this.logger.warn(
        { machineId: this.machineId, batchCode: event.batchCode, eventId: event.id },
        'BatchCancelledEvent received with no active batch - ignoring',
      )
      return
    }

    const cancelTime = event.datetime
    const updates: BatchDataUpdate = {
      cancelTime,
      realDuration: diffInSeconds(cancelTime, this.activeBatch.startTime),
      // Tonello does not provide this detail, default to "included in production"
      cancelDetail: CancelDetail.IncludeInProduction,
      actualTheoreticalDuration: 0,
      deviation: 0,
    }

    // Setting cancelTime will delete IO values due to triggers, so we need to move them to batch files first
    await this.moveIoValuesToBatchFiles(this.activeBatch.batchKey, trx)
    await this.deps.batchDataRepository.update(this.activeBatch.batchKey, updates, trx)
    await this.finalizeBatch(event.batchCode, cancelTime, trx)

    postCommitActions.push({
      type: 'addNote',
      batchCode: event.batchCode,
      message: `Batch was cancelled by operator ${this.status.runningOperatorName}`,
    })
  }

  private async finalizeBatch(
    jobOrder: string,
    endTime: Date,
    trx: Knex.Transaction,
  ): Promise<void> {
    const batchKey = this.activeBatch!.batchKey

    await this.deps.batchStepRepository.closeAllOpen(batchKey, endTime, trx)

    await this.deps.batchStopRepository.insert(
      {
        machineId: this.machineId,
        batchKey,
        stopReason: DEFAULT_STOP_REASON,
        startTime: endTime,
      },
      trx,
    )

    await this.deps.batchStartEndRepository.insert(
      {
        jobOrder,
        machineId: this.machineId,
        state: BatchStartEndState.End,
        date: endTime,
        programNoList: this.status.runningProgramNoList ?? [],
        totalRequestCount: 0,
      },
      trx,
    )

    this.activeBatch = null
    this.activeStep = null
    this.activeProgramIndex = null

    this.status.runningJobOrder = null
    this.status.runningJobOrderStartTime = null
    this.status.runningBatchKey = null
    this.status.runningBatchStatus = null
    this.status.runningProgramNo = null
    this.status.runningProgramName = null
    this.status.runningProgramNoList = null
    this.status.runningStepNo = null
    this.status.runningCommandNo = null
    this.status.runningCommandName = null
    this.status.runningOperatorNo = null
    this.status.runningOperatorName = null
    this.status.runningTheoreticalTime = null

    this.status.requestBatchKey = null
    this.status.requestJobOrder = null
    this.status.requestRecipeIndex = null
    this.status.requestOrderIndex = null
    this.status.requestOperationCode = null
    this.status.requestTargetRecipe = null
    this.status.requestTankNo = null
    this.status.requestPriority = null
    this.status.requestTotalCount = null
    this.status.requestProgramNo = null
    this.status.requestCommandNo = null
    this.status.requestStatus = null
  }

  // ── CommandStart ────────────────────────────────────────────────────────────

  private async handleCommandStart(
    event: TonelloCommandStartEvent,
    trx: Knex.Transaction,
  ): Promise<void> {
    if (this.activeBatch === null) {
      this.logger.debug(
        { machineId: this.machineId, eventId: event.id },
        'CommandStartEvent ignored - no active batch',
      )
      return
    }

    if (this.activeStep !== null) {
      if (this.activeStep.stepNo === event.stepNumAct) {
        this.logger.warn(
          {
            machineId: this.machineId,
            runningCommandNo: this.activeStep.commandNo,
            newCommandNo: event.commandNum,
          },
          'Duplicate CommandStartEvent received for same step - ignoring',
        )
        return
      }

      // Tonello bug: CommandFinish was not sent for the previous step - close it now
      this.logger.warn(
        {
          machineId: this.machineId,
          prevStepNo: this.activeStep.stepNo,
          prevCommandNo: this.activeStep.commandNo,
          newStepNo: event.stepNumAct,
          newCommandNo: event.commandNum,
        },
        'CommandStartEvent received without prior CommandFinish - auto-closing previous step',
      )
      await this.deps.batchStepRepository.setEndTime(
        {
          batchKey: this.activeStep.batchKey,
          programNo: this.activeStep.programNo,
          stepNo: this.activeStep.stepNo,
          parallelStepNo: this.activeStep.parallelStepNo,
          commandNo: this.activeStep.commandNo,
        },
        event.datetime,
        trx,
      )
      this.activeStep = null
    }

    const step: BatchStepInsert = {
      batchKey: this.activeBatch.batchKey,
      programNo: event.programNum,
      programIndex: event.programIndex,
      stepNo: event.stepNumAct,
      parallelStepNo: 0,
      commandNo: event.commandNum,
      startTime: event.datetime,
      theoreticalDuration: 0,
    }
    const isProgramChanged = this.activeProgramIndex !== event.programIndex
    this.activeStep = step
    this.activeProgramIndex = event.programIndex
    await this.deps.batchStepRepository.insert(step, trx)

    const command = await this.deps.commandRepository.findByMachineAndCommandNo(this.machineId, event.commandNum)
    this.status.runningCommandNo = event.commandNum
    this.status.runningCommandName = command?.name ?? ''
    this.status.runningStepNo = event.stepNumAct

    if (isProgramChanged) {
      const program = await this.deps.programHeaderRepository.findByMachineAndProgramNo(this.machineId, event.programNum)
      this.status.runningProgramNo = event.programNum
      this.status.runningProgramName = program?.name ?? ''
    }
  }

  // ── CommandFinish ───────────────────────────────────────────────────────────

  private async handleCommandFinish(
    event: TonelloCommandFinishEvent,
    trx: Knex.Transaction,
  ): Promise<void> {
    if (this.activeBatch === null || this.activeStep === null) {
      this.logger.debug(
        { machineId: this.machineId, eventId: event.id },
        'CommandFinishEvent ignored - no active batch or command',
      )
      return
    }

    if (event.commandNum !== this.activeStep.commandNo) {
      this.logger.warn(
        {
          machineId: this.machineId,
          expected: this.activeStep.commandNo,
          received: event.commandNum,
        },
        'CommandFinishEvent commandNum mismatch',
      )
    }

    const endTime = event.datetime
    await this.deps.batchStepRepository.setEndTime(
      {
        batchKey: this.activeStep.batchKey,
        programNo: this.activeStep.programNo,
        stepNo: this.activeStep.stepNo,
        parallelStepNo: this.activeStep.parallelStepNo,
        commandNo: this.activeStep.commandNo,
      },
      endTime,
      trx,
    )
    this.activeStep = null
  }

  // ── ChemicalRequest ─────────────────────────────────────────────────────────

  private async handleChemicalRequest(
    event: TonelloChemicalRequestEvent,
    trx: Knex.Transaction,
  ): Promise<void> {
    if (this.activeBatch === null) {
      this.logger.debug(
        { machineId: this.machineId, eventId: event.id },
        'ChemicalRequestEvent ignored - no active batch',
      )
      return
    }

    const batchKey = this.activeBatch.batchKey
    const targetRecipe = mapTonelloChemicalRequestType(event.requestType)

    this.status.requestBatchKey = batchKey
    this.status.requestJobOrder = event.batchCode
    this.status.requestRecipeIndex = event.runningProgramIndex
    this.status.requestOrderIndex = event.requestOrder
    this.status.requestOperationCode = event.operationCode
    this.status.requestTargetRecipe = targetRecipe
    this.status.requestTankNo = event.tankNr
    this.status.requestPriority = event.priority
    this.status.requestTotalCount = event.batchTotRequestCount
    this.status.requestProgramNo = event.runningProgram
    this.status.requestCommandNo = event.runningCommand
    this.status.requestStatus = RequestStatus.New

    await this.deps.chemicalRequestRepository.insert(
      {
        batchKey,
        requestTime: event.datetime,
        jobOrder: event.batchCode,
        recipeIndex: event.runningProgramIndex,
        requestOrderIndex: event.requestOrder,
        operationCode: event.operationCode,
        targetRecipe,
        tankNo: event.tankNr,
        priority: event.priority,
        totalNumberOfRequest: event.batchTotRequestCount,
        programNo: event.runningProgram,
        commandNo: event.runningCommand,
        status: RequestStatus.New,
      },
      trx,
    )

    await this.deps.chemicalRequestStringRepository.insert(
      {
        batchKey,
        requestTime: event.datetime,
        isRequest: true,
        requestType: RequestType.RequestWithRecipeStep,
        priority: event.priority,
        machineNo: this.machineId,
        tankNo: event.tankNr,
        jobOrder: event.batchCode,
        programNo: event.runningProgram,
        requestOrderInBatch: event.requestOrder,
        requestOrderInProgram: event.requestOrder,
        totalNumberOfRequest: event.batchTotRequestCount,
        materialType: targetRecipe,
        programIndex: event.runningProgramIndex,
      },
      trx,
    )

    const requestKey = `${batchKey}:${event.requestOrder}`
    this.pendingChemicalRequests.set(requestKey, event)
  }

  // ── IO Value Changed ────────────────────────────────────────────────────────

  private async handleAnalogIoValue(
    event: TonelloIoValueChangedEvent,
    trx: Knex.Transaction,
  ): Promise<void> {
    if (this.activeBatch === null)
      return

    await this.deps.analogIoValueRepository.insert(
      {
        machineId: this.machineId,
        batchKey: this.activeBatch.batchKey,
        logTime: event.datetime,
        ioType: mapTonelloIoType(event.ioType),
        ioIndex: Number.parseInt(event.ioNum),
        ioValue: Number.parseFloat(event.value),
        source: ' ',
      },
      trx,
    )
  }

  private async flushDigitalBatch(datetime: Date, trx: Knex.Transaction): Promise<void> {
    if (this.activeBatch === null) {
      return
    }
    await this.deps.digitalIoValueRepository.insert(
      {
        batchKey: this.activeBatch.batchKey,
        logTime: datetime,
        diValues: [...this.currentDigitalInputValues],
        doFuncValues: [...this.currentDigitalOutputValues],
        doLockValues: null,
      },
      trx,
    )
  }

  // ── Chemical Request Responses (from DmResponsePoller) ──────────────────────

  /**
   * Receives a bundle of DM responses for this machine (ordered by ID ascending)
   * and sends each one back to the Tonello machine via the API.
   */
  async handleChemicalRequestResponses(
    responses: Array<{ id: number, batchKey: number, parsed: ChemicalRequestStringResponseParsed }>,
  ): Promise<void> {
    for (const response of responses) {
      const { batchKey, parsed } = response
      const requestKey = `${batchKey}:${parsed.requestOrderInBatch}`
      const originalEvent = this.pendingChemicalRequests.get(requestKey)

      if (!originalEvent) {
        this.logger.warn(
          { machineId: this.machineId, requestKey, responseId: response.id },
          'No pending chemical request found for response - skipping',
        )
        continue
      }

      const status = mapRequestStatusToTonello(parsed.status)
      const message
        = status === TonelloChemicalRequestStatus.Error ? `Request status: ${parsed.status}` : ''

      try {
        await this.api.submitChemicalRequestStatus({
          ...originalEvent,
          state: status,
          message,
        })
        this.logger.debug(
          { machineId: this.machineId, requestKey, status },
          'Chemical request response sent to machine',
        )
      } catch (err) {
        this.logger.error(
          { err, machineId: this.machineId, requestKey },
          'Failed to send chemical request response to machine',
        )
      }
    }
  }

  // ── Recovery ────────────────────────────────────────────────────────────────

  /**
   * Closes any open batch/command with the given datetime when missed events are detected.
   * Called before setting `skipUntilNextBatchStart = true`.
   */
  private async finalizeOnMissedEvents(datetime: Date, trx: Knex.Transaction): Promise<void> {
    if (this.activeStep !== null) {
      await this.deps.batchStepRepository.setEndTime(
        {
          batchKey: this.activeStep.batchKey,
          programNo: this.activeStep.programNo,
          stepNo: this.activeStep.stepNo,
          parallelStepNo: this.activeStep.parallelStepNo,
          commandNo: this.activeStep.commandNo,
        },
        datetime,
        trx,
      )
      this.activeStep = null
    }

    if (
      this.activeBatch !== null
      && this.activeBatch.endTime === null
      && this.activeBatch.cancelTime === null
    ) {
      await this.deps.batchDataRepository.update(
        this.activeBatch.batchKey,
        { cancelTime: datetime },
        trx,
      )
      this.activeBatch = null
      this.activeProgramIndex = null
      this.status.runningBatchKey = null
      this.status.runningJobOrder = null
      this.status.runningBatchStatus = null
    }
  }

  /**
   * Moves all IO values for the given batch from the main tables to the batch data files table as gzipped JSON.
   * Should be called when a batch is completed to archive the IO values and keep the main tables small for better performance.
   */
  private async moveIoValuesToBatchFiles(
    batchKey: number,
    trx: Knex.Transaction,
  ): Promise<void> {
    const [analogValues, digitalValues] = await Promise.all([
      this.deps.analogIoValueRepository.findByBatchKey(batchKey, trx),
      this.deps.digitalIoValueRepository.findByBatchKey(batchKey, trx),
    ])
    if (analogValues.length) {
      await this.deps.batchDataFilesRepository.insertAnalogValues(batchKey, analogValues, trx)
      await this.deps.analogIoValueRepository.deleteByBatchKey(batchKey, trx)
    }
    if (digitalValues.length) {
      await this.deps.batchDataFilesRepository.insertDigitalValues(batchKey, digitalValues, trx)
      await this.deps.digitalIoValueRepository.deleteByBatchKey(batchKey, trx)
    }
  }
}
