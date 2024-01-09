import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { manualId, manualReason, reportToERP } = await readBody(event)

  const res = await knex('BFMANUALREASONSGENERAL').where('manualID', manualId)
    .update({
      manualString: manualReason,
      ReportToERP: reportToERP,
    })

  return res
})
