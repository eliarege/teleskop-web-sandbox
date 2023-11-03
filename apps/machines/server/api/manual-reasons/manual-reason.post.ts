import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { manualId, newManualReason, reportToERP } = await readBody(event)

    const res = await knex('BFMANUALREASONSGENERAL')
      .insert({
        manualID: manualId,
        manualString: newManualReason,
        ReportToERP: reportToERP,
      })

    return res
  } catch (e) {
    return e
  }
})
