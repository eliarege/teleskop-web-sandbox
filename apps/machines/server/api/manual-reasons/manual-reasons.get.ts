import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    const manualReasons = await knex('BFMANUALREASONSGENERAL')
      .select({
        manualId: 'manualID',
        manualReason: 'manualString',
        reportToERP: 'ReportToERP',
      },
      )
    return manualReasons
  } catch (e) {
    return e
  }
})
