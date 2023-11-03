import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  try {
    return await knex('BFDYLOTFINISHREASONS').select({
      reasonId: 'REASONID',
      typeId: 'TYPEID',
      text: 'TEXT',
      reportToERP: 'ReportToERP',
    })
  } catch (e) {
    return e
  }
})
