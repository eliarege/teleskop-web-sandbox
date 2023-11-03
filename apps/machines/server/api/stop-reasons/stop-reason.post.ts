import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { stopCode, newStopName, reportToERP } = await readBody(event)

    const res = await knex('BFSTOPREASONS')
      .insert({
        STOPCODE: stopCode,
        STOPNAME: newStopName,
        ReportToERP: reportToERP,
      })

    return res
  } catch (e) {
    return e
  }
})
