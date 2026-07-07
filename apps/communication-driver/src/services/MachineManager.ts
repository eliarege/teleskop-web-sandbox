import type { AppCradle } from '../container'
import type { Machine } from '../db/models'
import type { MachineSessionDeps } from './MachineSession'
import { MachineSession } from './MachineSession'

export class MachineManager {
  private readonly sessions = new Map<number, MachineSession>()
  private refreshTimer: ReturnType<typeof setInterval> | null = null

  private readonly eventPollingInterval: number
  private readonly machineRefreshInterval: number
  private readonly logger: AppCradle['logger']
  private readonly machineRepository: AppCradle['machineRepository']
  private readonly sessionDeps: MachineSessionDeps

  constructor({
    config,
    logger,
    teleskop,
    machineRepository,
    machineStatusRepository,
    batchDataRepository,
    batchStepRepository,
    batchStopRepository,
    batchStartEndRepository,
    analogIoValueRepository,
    digitalIoValueRepository,
    batchDataFilesRepository,
    chemicalRequestRepository,
    chemicalRequestStringRepository,
    batchPlanRepository,
    commandRepository,
    programHeaderRepository,
    planningBoardService,
  }: AppCradle) {
    this.eventPollingInterval = config.eventPollingInterval
    this.machineRefreshInterval = config.machineRefreshInterval
    this.logger = logger
    this.machineRepository = machineRepository
    this.sessionDeps = {
      teleskop,
      digitalIoFlushInterval: config.digitalIoFlushInterval,
      timeSyncMaxDriftMinutes: config.timeSyncMaxDriftMinutes,
      machineStatusRepository,
      batchDataRepository,
      batchStepRepository,
      batchStopRepository,
      batchStartEndRepository,
      analogIoValueRepository,
      digitalIoValueRepository,
      batchDataFilesRepository,
      chemicalRequestRepository,
      chemicalRequestStringRepository,
      batchPlanRepository,
      commandRepository,
      programHeaderRepository,
      planningBoardService,
    }
  }

  async start(): Promise<void> {
    await this.refresh()
    this.refreshTimer = setInterval(() => void this.refresh(), this.machineRefreshInterval)
  }

  stop(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    for (const session of this.sessions.values()) {
      session.stopPolling()
    }
    this.sessions.clear()
  }

  getSessions(): ReadonlyMap<number, MachineSession> {
    return this.sessions
  }

  private async refresh(): Promise<void> {
    let activeMachines: Machine[]
    try {
      activeMachines = await this.machineRepository.findActiveTonello()
    } catch (err) {
      this.logger.error({ err }, 'Failed to fetch active Tonello machines - skipping refresh')
      return
    }

    const activeMachineIds = new Set(activeMachines.map(m => m.machineId))

    // Stop sessions for machines that are no longer active
    for (const [machineId, session] of this.sessions) {
      if (!activeMachineIds.has(machineId)) {
        this.logger.info({ machineId }, 'Machine removed - stopping session')
        session.stopPolling()
        this.sessions.delete(machineId)
      }
    }

    // Start sessions for newly detected machines
    for (const machine of activeMachines) {
      if (!this.sessions.has(machine.machineId)) {
        await this.startSession(machine)
      }
    }
  }

  private async startSession(machine: Machine): Promise<void> {
    this.logger.info(
      { machineId: machine.machineId, machineCode: machine.machineCode },
      'New machine detected - starting session',
    )

    try {
      // Ensure the status row exists (creates it if this is the first time seeing this machine)
      await this.sessionDeps.machineStatusRepository.ensureExists(machine.machineId)

      const session = new MachineSession(
        machine,
        this.logger,
        this.sessionDeps,
      )

      await session.init()
      session.startPolling(this.eventPollingInterval)
      this.sessions.set(machine.machineId, session)
    } catch (err) {
      this.logger.error(
        { err, machineId: machine.machineId },
        'Failed to start session for machine',
      )
    }
  }
}
