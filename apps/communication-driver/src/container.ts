import type { AwilixContainer } from 'awilix'
import type { Knex } from 'knex'
import type { Logger } from 'pino'
import type { Config } from './config'
import type { AnalogIoValueRepository } from './db/repositories/AnalogIoValueRepository'
import type { BatchAlarmRepository } from './db/repositories/BatchAlarmRepository'
import type { BatchConsumptionRepository } from './db/repositories/BatchConsumptionRepository'
import type { BatchDataRepository } from './db/repositories/BatchDataRepository'
import type { BatchDataFilesRepository } from './db/repositories/BatchDataFilesRepository'
import type { BatchParameterRepository } from './db/repositories/BatchParameterRepository'
import type { BatchPlanRepository } from './db/repositories/BatchPlanRepository'
import type { BatchStartEndRepository } from './db/repositories/BatchStartEndRepository'
import type { BatchStepRepository } from './db/repositories/BatchStepRepository'
import type { BatchStopRepository } from './db/repositories/BatchStopRepository'
import type { CalculatedValueRepository } from './db/repositories/CalculatedValueRepository'
import type { ChemicalRequestRepository } from './db/repositories/ChemicalRequestRepository'
import type { ChemicalRequestStringRepository } from './db/repositories/ChemicalRequestStringRepository'
import type { CommandRepository } from './db/repositories/CommandRepository'
import type { DigitalIoValueRepository } from './db/repositories/DigitalIoValueRepository'
import type { MachineRepository } from './db/repositories/MachineRepository'
import type { MachineStatusRepository } from './db/repositories/MachineStatusRepository'
import type { ProgramHeaderRepository } from './db/repositories/ProgramHeaderRepository'
import type { SetpointChangeRepository } from './db/repositories/SetpointChangeRepository'
import type { StepChangeRepository } from './db/repositories/StepChangeRepository'
import type { DmResponsePoller } from './services/DmResponsePoller'
import type { MachineManager } from './services/MachineManager'
import type { PlanningBoardService } from './services/PlanningBoardService'

export interface AppCradle {
  config: Config
  logger: Logger
  teleskop: Knex
  dmExchange: Knex | null
  teleskopTimezoneOffset: number
  analogIoValueRepository: AnalogIoValueRepository
  batchAlarmRepository: BatchAlarmRepository
  batchConsumptionRepository: BatchConsumptionRepository
  batchDataRepository: BatchDataRepository
  batchDataFilesRepository: BatchDataFilesRepository
  batchParameterRepository: BatchParameterRepository
  batchStepRepository: BatchStepRepository
  batchStopRepository: BatchStopRepository
  calculatedValueRepository: CalculatedValueRepository
  digitalIoValueRepository: DigitalIoValueRepository
  batchPlanRepository: BatchPlanRepository
  batchStartEndRepository: BatchStartEndRepository
  chemicalRequestRepository: ChemicalRequestRepository
  chemicalRequestStringRepository: ChemicalRequestStringRepository
  machineRepository: MachineRepository
  machineStatusRepository: MachineStatusRepository
  setpointChangeRepository: SetpointChangeRepository
  stepChangeRepository: StepChangeRepository
  commandRepository: CommandRepository
  programHeaderRepository: ProgramHeaderRepository
  planningBoardService: PlanningBoardService
  machineManager: MachineManager
  dmResponsePoller: DmResponsePoller
}

export type AppContainer = AwilixContainer<AppCradle>
