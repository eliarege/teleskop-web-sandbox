import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { stopCode, stopName, reportToERP } = await readBody(event)

    const res = await knex('BFSTOPREASONS')
      .insert({
        STOPCODE: stopCode,
        STOPNAME: stopName,
        ReportToERP: reportToERP,
      })

    return res
  } catch (e) {
    return e
  }
})
