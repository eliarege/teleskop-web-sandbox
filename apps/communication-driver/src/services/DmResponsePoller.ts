import type { AppCradle } from '../container'
import type { ChemicalRequestStringRepository } from '../db/repositories/ChemicalRequestStringRepository'
import type { MachineManager } from './MachineManager'

export class DmResponsePoller {
  private pollingTimer: ReturnType<typeof setTimeout> | null = null
  private pollingInterval = 0

  private readonly logger: AppCradle['logger']
  private readonly chemicalRequestStringRepository: AppCradle['chemicalRequestStringRepository']
  private readonly machineManager: MachineManager

  constructor({ logger, chemicalRequestStringRepository, machineManager }: AppCradle) {
    this.logger = logger.child({ service: 'DmResponsePoller' })
    this.chemicalRequestStringRepository = chemicalRequestStringRepository
    this.machineManager = machineManager
  }

  start(interval: number): void {
    this.pollingInterval = interval
    this.pollingTimer = setTimeout(() => void this.runPollLoop(), interval)
  }

  stop(): void {
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

  private async poll(): Promise<void> {
    let pendingResponses: Awaited<
      ReturnType<ChemicalRequestStringRepository['findAllPendingResponses']>
    >
    try {
      pendingResponses = await this.chemicalRequestStringRepository.findAllPendingResponses()
    } catch (err) {
      this.logger.error({ err }, 'Failed to fetch pending responses')
      return
    }

    if (pendingResponses.length === 0)
      return

    const sessions = this.machineManager.getSessions()

    for (const res of pendingResponses) {
      const session = sessions.get(res.parsed.machineId)
      if (!session) {
        this.logger.warn(
          { machineId: res.parsed.machineId },
          'No active session found for machineId in response - skipping',
        )
        await this.chemicalRequestStringRepository
          .deleteById(res.id)
          .catch(err =>
            this.logger.error({ err, id: res.id }, 'Failed to delete orphaned response row with missing session'),
          )
        continue
      }
      this.logger.debug({ response: res.request }, `Received chemical request response for machine ${res.parsed.machineId}`)
      await session.handleChemicalRequestResponses([
        { id: res.id, batchKey: res.batchKey!, parsed: res.parsed },
      ])
      await this.chemicalRequestStringRepository
        .deleteById(res.id)
        .catch(err =>
          this.logger.error({ err, id: res.id }, 'Failed to delete response row after sending'),
        )
    }
  }
}
