import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { manualId, manualReason, reportToERP } = await readBody(event)

    const res = await knex('BFMANUALREASONSGENERAL')
      .insert({
        manualID: manualId,
        manualString: manualReason,
        ReportToERP: reportToERP,
      })

    return res
  } catch (e) {
    return e
  }
})
