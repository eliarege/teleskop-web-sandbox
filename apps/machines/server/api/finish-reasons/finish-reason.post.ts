import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { reasonId, typeId, text } = await readBody(event)
    console.log('reasonId, typeId, text, reportToERP = ', reasonId, typeId, text)
    const res = await knex('BFDYLOTFINISHREASONS')
      .insert({
        REASONID: reasonId,
        TYPEID: typeId,
        TEXT: text,
        ReportToERP: false,
      })

    return res
  } catch (e) {
    return e
  }
})
