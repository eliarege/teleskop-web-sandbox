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
import { TonelloChemicalRequestType, TonelloEventCode, TonelloIoType } from '@teleskop/core'
import { ConnectionStatus, MaterialType, RequestStatus } from '../../src/db/enums'
import type { ChemicalRequestStringResponseParsed, ExtendedTonelloChemicalRequestEvent, Machine, MachineStatus } from '../../src/db/models'

let _eventId = 1
export function nextId(): number {
  return _eventId++
}
export function resetIds(): void {
  _eventId = 1
}

export function makeDate(offsetSeconds = 0): Date {
  return new Date(Date.UTC(2026, 3, 4, 8, 0, 0) + offsetSeconds * 1000)
}

export const machineId = 10

// ── Machine / Status fixtures ─────────────────────────────────────────────────

export function makeMachine(overrides?: Partial<Machine>): Machine {
  return {
    machineId,
    machineCode: 'TEST-01',
    groupNo: 1,
    tbbModel: 'Tonello',
    version: null,
    ipAddress: '192.168.1.10',
    port: 1234,
    inUse: true,
    isVirtual: false,
    lastEventProcessDate: null,
    lastEventProcessId: null,
    lastJobOrder: null,
    lastBatchKey: null,
    batchDownloadStatus: null,
    batchNo: null,
    batchDownloadStatusChangeTime: null,
    onlineActive: null,
    isMaster: false,
    slaveMachineId: 0,
    theoricElectricity: false,
    theoricWater: false,
    theoricSteam: true,
    useInTeleskop: true,
    machineCapacity: 100,
    theoreticalCharge: 100,
    reelCount: null,
    nozzleCount: null,
    ...overrides,
  }
}

export function makeMachineStatus(overrides?: Partial<MachineStatus>): MachineStatus {
  return {
    machineId,
    updateTime: null,
    lastEventProcessDate: null,
    lastEventProcessId: null,
    lastReferenceNumber: null,
    lastReferenceDate: null,
    runningJobOrder: null,
    runningJobOrderStartTime: null,
    runningProgramNoList: null,
    runningBatchKey: null,
    runningBatchStatus: null,
    runningAutoManStatus: null,
    runningProgramNo: null,
    runningProgramName: null,
    runningStepNo: null,
    runningCommandNo: null,
    runningCommandName: null,
    runningAlarmNo: null,
    runningAlarmName: null,
    runningOperatorNo: null,
    runningOperatorName: null,
    runningTheoreticalTime: null,
    runningPhaseNo: null,
    runningPhaseName: null,
    runningPhaseStepNo: null,
    isCoupled: null,
    requestBatchKey: null,
    requestJobOrder: null,
    requestRecipeIndex: null,
    requestOrderIndex: null,
    requestOperationCode: null,
    requestTargetRecipe: null,
    requestTankNo: null,
    requestPriority: null,
    requestTotalCount: null,
    requestProgramNo: null,
    requestCommandNo: null,
    requestStatus: null,
    consumptionElectricityStart: null,
    consumptionElectricityExportStart: null,
    consumptionElectricityCapacitiveStart: null,
    consumptionElectricityReactiveStart: null,
    lastReceivedEventDate: null,
    lastReceivedEventId: null,
    lastReceivedBatchEventDate: null,
    stopReason: null,
    stopReasonDateTime: null,
    connectionStatus: ConnectionStatus.Unknown,
    isSynchronizing: null,
    currentTemperature: null,
    currentAlarmStatus: null,
    completionRatio: null,
    lastPingFail: new Date(0),
    lastSoapFail: new Date(0),
    waterConsumption1: null,
    waterConsumption2: null,
    waterConsumption1Last: null,
    waterConsumption2Last: null,
    electricityConsumption: null,
    electricityConsumptionLast: null,
    consumptionReadDate: null,
    steamConsumption: null,
    steamConsumptionLast: null,
    steamReadDate: null,
    manualReason: null,
    manualReasonDateTime: null,
    manualCommandActive: false,
    runningBatchDelay: 0,
    lastEventCode: null,
    batchLoaded: null,
    lastEventId: 0,
    lastEventDate: '1970-01-01',
    ...overrides,
  }
}

// ── Event builders ────────────────────────────────────────────────────────────

export function batchStartEvent(opts: {
  batchCode?: string
  offsetSeconds?: number
  programList?: string[]
} = {}): TonelloBatchStartEvent {
  const { batchCode = 'ALPHA', offsetSeconds = 0, programList = [] } = opts
  return {
    id: nextId(),
    eventValue: TonelloEventCode.BatchStartEvent,
    datetime: makeDate(offsetSeconds),
    batchCode,
    operator: 5,
    type: 1,
    weight: 200,
    program: 0,
    programList,
    rawDatetime: '',
  }
}

export function batchEndEvent(opts: {
  batchCode?: string
  offsetSeconds?: number
} = {}): TonelloBatchEndEvent {
  const { batchCode = 'ALPHA', offsetSeconds = 100 } = opts
  return {
    id: nextId(),
    eventValue: TonelloEventCode.BatchEndEvent,
    datetime: makeDate(offsetSeconds),
    batchCode,
    rawDatetime: '',
  }
}

export function batchCancelledEvent(opts: {
  batchCode?: string
  offsetSeconds?: number
} = {}): TonelloBatchCancelledEvent {
  const { batchCode = 'ALPHA', offsetSeconds = 100 } = opts
  return {
    id: nextId(),
    eventValue: TonelloEventCode.BatchCancelledEvent,
    datetime: makeDate(offsetSeconds),
    batchCode,
    rawDatetime: '',
  }
}

export function commandStartEvent(opts: {
  commandNum?: number
  programNum?: number
  programIndex?: number
  stepNumAct?: number
  offsetSeconds?: number
} = {}): TonelloCommandStartEvent {
  const { commandNum = 1, programNum = 100, programIndex = 1, stepNumAct = 1, offsetSeconds = 10 } = opts
  return {
    id: nextId(),
    eventValue: TonelloEventCode.CommandStartEvent,
    datetime: makeDate(offsetSeconds),
    commandNum,
    stepNumTrt: stepNumAct,
    stepNumAct,
    programNum,
    programIndex,
    rawDatetime: '',
  }
}

export function commandFinishEvent(opts: {
  commandNum?: number
  programNum?: number
  programIndex?: number
  stepNumAct?: number
  offsetSeconds?: number
} = {}): TonelloCommandFinishEvent {
  const { commandNum = 1, programNum = 100, programIndex = 1, stepNumAct = 1, offsetSeconds = 20 } = opts
  return {
    id: nextId(),
    eventValue: TonelloEventCode.CommandFinishEvent,
    datetime: makeDate(offsetSeconds),
    commandNum,
    stepNumTrt: stepNumAct,
    stepNumAct,
    programNum,
    programIndex,
    rawDatetime: '',
  }
}

export function chemicalRequestEvent(opts: {
  requestOrder?: number
  batchCode?: string
  offsetSeconds?: number
  requestType?: TonelloChemicalRequestType
  tankNr?: number
  priority?: number
  runningProgramIndex?: number
  batchTotRequestCount?: number
  /** Overrides the computed program-scoped request order stored in `custom`. Relevant for Chemical requests restored from DB. */
  customRequestOrderInProgram?: number
  /** Overrides the computed program-scoped total stored in `custom`. Relevant for Chemical requests restored from DB. */
  customTotalRequestsInProgram?: number
} = {}): ExtendedTonelloChemicalRequestEvent {
  const {
    requestOrder = 1,
    batchCode = 'ALPHA',
    offsetSeconds = 15,
    requestType = TonelloChemicalRequestType.Dye,
    tankNr = 7,
    priority = 50,
    runningProgramIndex = 1,
    batchTotRequestCount = 3,
    customRequestOrderInProgram = requestOrder,
    customTotalRequestsInProgram = 1,
  } = opts
  return {
    id: nextId(),
    eventValue: TonelloEventCode.ChemicalRequestEvent,
    datetime: makeDate(offsetSeconds),
    batchCode,
    runningProgram: 100,
    runningCommand: 1,
    requestType,
    operationCode: 42,
    batchTotRequestCount,
    programTotRequestCount: 1,
    requestOrder,
    tankNr,
    priority,
    runningProgramIndex,
    runningCommandIndex: 0,
    rawDatetime: '',
    custom: {
      requestOrderInProgram: customRequestOrderInProgram,
      totalRequestsInProgram: customTotalRequestsInProgram,
    },
  }
}

export function digitalIoChangedEvent(opts: {
  /** 1-based IO number */
  ioNum: number
  value: '0' | '1'
  type: TonelloIoType
  offsetSeconds?: number
}): TonelloIoValueChangedEvent {
  const { ioNum, value, type, offsetSeconds = 5 } = opts
  return {
    id: nextId(),
    eventValue: TonelloEventCode.IoValueChangedEvent,
    datetime: makeDate(offsetSeconds),
    ioType: type,
    ioNum: String(ioNum),
    value,
    rawDatetime: '',
  }
}

export function analogIoChangedEvent(opts: {
  ioNum: number
  value: string
  type?: TonelloIoType
  offsetSeconds?: number
}): TonelloIoValueChangedEvent {
  const { ioNum, value, type = TonelloIoType.AnalogInput, offsetSeconds = 5 } = opts
  return {
    id: nextId(),
    eventValue: TonelloEventCode.IoValueChangedEvent,
    datetime: makeDate(offsetSeconds),
    ioType: type,
    ioNum: String(ioNum),
    value,
    rawDatetime: '',
  }
}

/**
 * Builds a parsed Dispensing Manager response that matches the defaults of
 * `chemicalRequestEvent` (Dye type, requestOrder=1, batchTotRequestCount=3).
 * Override only the fields relevant to each test.
 */
export function makeChemicalResponse(opts: {
  status?: RequestStatus
  materialType?: MaterialType
  requestOrder?: number
  totalRequests?: number
  priority?: number
  jobOrder?: string
  programIndex?: number
} = {}): ChemicalRequestStringResponseParsed {
  return {
    status: opts.status ?? RequestStatus.Completed,
    priority: opts.priority ?? 50,
    machineId: machineId,
    tankNo: 7,
    jobOrder: opts.jobOrder ?? 'ALPHA',
    programNo: 100,
    requestOrder: opts.requestOrder ?? 1,
    totalRequests: opts.totalRequests ?? 3,
    materialType: opts.materialType ?? MaterialType.Dye,
    programIndex: opts.programIndex ?? 1,
  }
}

export function events(...es: TonelloEvent[]): TonelloEvent[] {
  return es
}
