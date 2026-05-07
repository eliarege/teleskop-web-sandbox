import { $fetch } from 'ofetch'
import type { Logger } from 'pino'
import type { Config } from '../config'

const COMMUNICATIONS_DRIVER_USER_ID = 1
const COMMUNICATIONS_DRIVER_USER_TYPE = 0

export class PlanningBoardService {
  private readonly baseUrl: string | null
  private readonly logger: Logger

  constructor({ config, logger }: { config: Config, logger: Logger }) {
    this.baseUrl = config.planningBoardUrl ?? null
    this.logger = logger
  }

  async unplanBatch(planKey: number): Promise<void> {
    if (!this.baseUrl)
      return
    try {
      await $fetch('/planning_board/unplan', {
        baseURL: this.baseUrl,
        method: 'PUT',
        body: { planKey },
      })
    } catch (err) {
      this.logger.warn({ err, planKey }, 'Failed to unplan batch from planning board')
    }
  }

  async addBatchNote(jobOrder: string, note: string): Promise<void> {
    if (!this.baseUrl)
      return
    try {
      await $fetch('/planning_board/batch_notes/add_note', {
        baseURL: this.baseUrl,
        method: 'POST',
        body: {
          jobOrder,
          note,
          userId: COMMUNICATIONS_DRIVER_USER_ID,
          userType: COMMUNICATIONS_DRIVER_USER_TYPE,
          showOnScreen: false,
        },
      })
    } catch (err) {
      this.logger.warn({ err, jobOrder }, 'Failed to add batch note to planning board')
    }
  }
}
