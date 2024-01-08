import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { reasonId, typeId, text } = await readBody(event)
  const res = await knex('BFDYLOTFINISHREASONS')
    .insert({
      REASONID: reasonId,
      TYPEID: typeId,
      TEXT: text,
      ReportToERP: false,
    })

  return res
})
