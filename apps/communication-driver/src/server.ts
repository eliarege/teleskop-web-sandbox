import process from 'node:process'
import { asClass, asValue, createContainer } from 'awilix'
import pino from 'pino'
import { buildConfig } from './config'
import type { AppCradle } from './container'
import { createDmExchangeDatabase, createTeleskopDatabase } from './db/factory'
import { KnexAnalogIoValueRepository } from './db/repositories/AnalogIoValueRepository'
import { KnexBatchAlarmRepository } from './db/repositories/BatchAlarmRepository'
import { KnexBatchConsumptionRepository } from './db/repositories/BatchConsumptionRepository'
import { KnexBatchDataRepository } from './db/repositories/BatchDataRepository'
import { KnexBatchDataFilesRepository } from './db/repositories/BatchDataFilesRepository'
import { KnexBatchParameterRepository } from './db/repositories/BatchParameterRepository'
import { KnexBatchPlanRepository } from './db/repositories/BatchPlanRepository'
import { KnexBatchStartEndRepository } from './db/repositories/BatchStartEndRepository'
import { KnexBatchStepRepository } from './db/repositories/BatchStepRepository'
import { KnexBatchStopRepository } from './db/repositories/BatchStopRepository'
import { KnexCalculatedValueRepository } from './db/repositories/CalculatedValueRepository'
import { KnexChemicalRequestRepository } from './db/repositories/ChemicalRequestRepository'
import { KnexChemicalRequestStringRepository } from './db/repositories/ChemicalRequestStringRepository'
import { KnexCommandRepository } from './db/repositories/CommandRepository'
import { KnexDigitalIoValueRepository } from './db/repositories/DigitalIoValueRepository'
import { KnexMachineRepository } from './db/repositories/MachineRepository'
import { KnexMachineStatusRepository } from './db/repositories/MachineStatusRepository'
import { KnexProgramHeaderRepository } from './db/repositories/ProgramHeaderRepository'
import { KnexSetpointChangeRepository } from './db/repositories/SetpointChangeRepository'
import { KnexStepChangeRepository } from './db/repositories/StepChangeRepository'
import { DmResponsePoller } from './services/DmResponsePoller'
import { MachineManager } from './services/MachineManager'
import { PlanningBoardService } from './services/PlanningBoardService'

async function main() {
  const config = buildConfig()

  const logger = pino({
    level: config.logLevel,
    // Don't include PID and hostname in logs, as they are not relevant in a containerized environment and just add noise
    base: null,
  })

  const teleskop = createTeleskopDatabase(config)
  const dmExchange = config.dmExchangeEnabled ? createDmExchangeDatabase(config) : null

  const container = createContainer<AppCradle>()
  container.register({
    // Values
    config: asValue(config),
    logger: asValue(logger),
    teleskop: asValue(teleskop),
    dmExchange: asValue(dmExchange),
    teleskopTimezoneOffset: asValue(config.teleskopTimezoneOffset),
    // Repositories
    analogIoValueRepository: asClass(KnexAnalogIoValueRepository).singleton(),
    batchAlarmRepository: asClass(KnexBatchAlarmRepository).singleton(),
    batchConsumptionRepository: asClass(KnexBatchConsumptionRepository).singleton(),
    batchDataRepository: asClass(KnexBatchDataRepository).singleton(),
    batchDataFilesRepository: asClass(KnexBatchDataFilesRepository).singleton(),
    batchParameterRepository: asClass(KnexBatchParameterRepository).singleton(),
    batchStepRepository: asClass(KnexBatchStepRepository).singleton(),
    batchStopRepository: asClass(KnexBatchStopRepository).singleton(),
    calculatedValueRepository: asClass(KnexCalculatedValueRepository).singleton(),
    digitalIoValueRepository: asClass(KnexDigitalIoValueRepository).singleton(),
    batchPlanRepository: asClass(KnexBatchPlanRepository).singleton(),
    batchStartEndRepository: asClass(KnexBatchStartEndRepository).singleton(),
    chemicalRequestRepository: asClass(KnexChemicalRequestRepository).singleton(),
    chemicalRequestStringRepository: asClass(KnexChemicalRequestStringRepository).singleton(),
    machineRepository: asClass(KnexMachineRepository).singleton(),
    machineStatusRepository: asClass(KnexMachineStatusRepository).singleton(),
    setpointChangeRepository: asClass(KnexSetpointChangeRepository).singleton(),
    stepChangeRepository: asClass(KnexStepChangeRepository).singleton(),
    commandRepository: asClass(KnexCommandRepository).singleton(),
    programHeaderRepository: asClass(KnexProgramHeaderRepository).singleton(),
    // Services
    planningBoardService: asClass(PlanningBoardService).singleton(),
    machineManager: asClass(MachineManager).singleton(),
    dmResponsePoller: asClass(DmResponsePoller).singleton(),
  })

  const { machineManager, dmResponsePoller } = container.cradle

  const shutdown = async () => {
    logger.info('Shutting down communications driver...')
    machineManager.stop()
    dmResponsePoller.stop()
    await teleskop.destroy()
    if (dmExchange)
      await dmExchange.destroy()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown())
  process.on('SIGTERM', () => void shutdown())

  logger.info('Starting communications driver')
  await machineManager.start()
  dmResponsePoller.start(config.dmResponsePollingInterval)
  logger.info('Communications driver running')
}

main().catch((err) => {
  console.error('Fatal error starting communications driver:', err)
  process.exit(1)
})
