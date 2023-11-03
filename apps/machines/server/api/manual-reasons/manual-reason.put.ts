import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { oldManualReason, newManualReason, reportToERP } = await readBody(event)

    const res = await knex('BFMANUALREASONSGENERAL').where('manualString', oldManualReason)
      .update({
        manualString: newManualReason,
        ReportToERP: reportToERP,
      })

    return res
  } catch (e) {
    return e
  }
})
