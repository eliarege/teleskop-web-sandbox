import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { manualId, manualReason, reportToERP } = await readBody(event)

  const res = await knex('BFMANUALREASONSGENERAL')
    .insert({
      manualID: manualId,
      manualString: manualReason,
      ReportToERP: reportToERP,
    })

  return res
})
