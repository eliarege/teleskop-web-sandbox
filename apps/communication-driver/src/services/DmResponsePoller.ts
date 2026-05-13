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
    this.logger = logger
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
      this.logger.error({ err }, 'DmResponsePoller: failed to fetch pending responses')
      return
    }

    if (pendingResponses.length === 0)
      return

    // Group by batchKey (responses are already ordered by ID ascending)
    const byBatchKey = new Map<number, typeof pendingResponses>()
    for (const row of pendingResponses) {
      if (row.batchKey === null)
        continue
      const group = byBatchKey.get(row.batchKey) ?? []
      group.push(row)
      byBatchKey.set(row.batchKey, group)
    }

    const sessions = this.machineManager.getSessions()

    for (const [batchKey, group] of byBatchKey) {
      // Find the session responsible for this batchKey
      const session = [...sessions.values()].find(s => s.runningBatchKey === batchKey)

      if (!session) {
        this.logger.warn(
          { batchKey },
          'DmResponsePoller: no session found for batchKey - skipping group',
        )
        // Still delete so we don't get stuck
        for (const row of group) {
          await this.chemicalRequestStringRepository
            .deleteById(row.id)
            .catch(err =>
              this.logger.error({ err, id: row.id }, 'Failed to delete orphaned response row'),
            )
        }
        continue
      }

      // Send responses in ID order, delete each after sending
      for (const row of group) {
        this.logger.debug({ response: row.request }, `Received chemical request response for batch ${batchKey}`)
        await session.handleChemicalRequestResponses([
          { id: row.id, batchKey: row.batchKey!, parsed: row.parsed },
        ])
        await this.chemicalRequestStringRepository
          .deleteById(row.id)
          .catch(err =>
            this.logger.error({ err, id: row.id }, 'Failed to delete response row after sending'),
          )
      }
    }
  }
}
