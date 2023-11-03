import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    return await knex('BFSTOPREASONS').select({
      stopCode: 'STOPCODE',
      stopName: 'STOPNAME',
      reportToERP: 'ReportToERP',
    })
  } catch (e) {
    return e
  }
})
