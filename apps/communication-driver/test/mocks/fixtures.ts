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
import { ConnectionStatus } from '../../src/db/enums'
import type { Machine, MachineStatus } from '../../src/db/models'

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
    lastEventId: null,
    lastEventDate: null,
    ...overrides,
  }
}

// ── Event builders ────────────────────────────────────────────────────────────

export function batchStartEvent(batchCode = 'ALPHA', offsetSeconds = 0): TonelloBatchStartEvent {
  return {
    id: nextId(),
    eventValue: TonelloEventCode.BatchStartEvent,
    datetime: makeDate(offsetSeconds),
    batchCode,
    operator: 5,
    type: 1,
    weight: 200,
    program: 0,
    programList: [],
    rawDatetime: '',
  }
}

export function batchEndEvent(batchCode = 'ALPHA', offsetSeconds = 100): TonelloBatchEndEvent {
  return {
    id: nextId(),
    eventValue: TonelloEventCode.BatchEndEvent,
    datetime: makeDate(offsetSeconds),
    batchCode,
    rawDatetime: '',
  }
}

export function batchCancelledEvent(
  batchCode = 'ALPHA',
  offsetSeconds = 100,
): TonelloBatchCancelledEvent {
  return {
    id: nextId(),
    eventValue: TonelloEventCode.BatchCancelledEvent,
    datetime: makeDate(offsetSeconds),
    batchCode,
    rawDatetime: '',
  }
}

export function commandStartEvent(
  commandNum = 1,
  programNum = 100,
  programIndex = 1,
  stepNumAct = 1,
  offsetSeconds = 10,
): TonelloCommandStartEvent {
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

export function commandFinishEvent(
  commandNum = 1,
  programNum = 100,
  programIndex = 1,
  stepNumAct = 1,
  offsetSeconds = 20,
): TonelloCommandFinishEvent {
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

export function chemicalRequestEvent(
  requestOrder = 1,
  batchCode = 'ALPHA',
  offsetSeconds = 15,
): TonelloChemicalRequestEvent {
  return {
    id: nextId(),
    eventValue: TonelloEventCode.ChemicalRequestEvent,
    datetime: makeDate(offsetSeconds),
    batchCode,
    runningProgram: 100,
    runningCommand: 1,
    requestType: TonelloChemicalRequestType.Chemical,
    operationCode: 42,
    batchTotRequestCount: 3,
    programTotRequestCount: 1,
    requestOrder,
    tankNr: 7,
    priority: 50,
    runningProgramIndex: 0,
    runningCommandIndex: 0,
    rawDatetime: '',
  }
}

export function digitalIoChangedEvent(
  /** Should start from 1 */
  ioNum: number,
  value: '0' | '1',
  type: TonelloIoType,
  offsetSeconds = 5,
): TonelloIoValueChangedEvent {
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

export function analogIoChangedEvent(
  ioNum: number,
  value: string,
  type: TonelloIoType = TonelloIoType.AnalogInput,
  offsetSeconds = 5,
): TonelloIoValueChangedEvent {
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

export function events(...es: TonelloEvent[]): TonelloEvent[] {
  return es
}
