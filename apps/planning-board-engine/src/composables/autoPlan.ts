import type { Knex } from 'knex'
import { logger } from './logger'
import { preplanJoborders } from '~/api/scheduler/queue-based/queries'

let lastRowCount = 0

export async function autoPlan(knex: Knex) {
  const hasAutoAdd = await knex('DYCTCTSCONFIG').select('AUTOADDTOPLANQUEUE').first()
  if (!hasAutoAdd?.AUTOADDTOPLANQUEUE) {
    logger.info('AUTOADDTOPLANQUEUE is disabled, skipping autoPlan')
    return
  }
  try {
    const result = await knex('DYBFBATCHPLAN').count<{ totalRows: string }[]>('* as totalRows')
    const totalCount = Number.parseInt(result[0].totalRows, 10)

    if (totalCount !== lastRowCount) {
      logger.info({ lastRowCount, totalCount }, 'Row count changed, triggering preplanJoborders')
      lastRowCount = totalCount
      await preplanJoborders(logger)
    } else {
      logger.info('No change in DYBFBATCHPLAN row count')
    }
  } catch (err) {
    logger.error(err, 'Error in autoPlan')
  }
}
