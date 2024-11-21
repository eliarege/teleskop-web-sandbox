import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { stopCode, stopName, reportToERP } = await readBody(event)

  const res = await knex('BFSTOPREASONS').where('STOPCODE', stopCode)
    .update({
      STOPNAME: stopName,
      ReportToERP: reportToERP,
    })

  return res
})
