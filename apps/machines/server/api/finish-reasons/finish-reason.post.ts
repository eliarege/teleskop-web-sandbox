import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { reasonId, formData } = await readBody(event)
  const res = await knex('BFDYLOTFINISHREASONS')
    .insert({
      REASONID: reasonId,
      TYPEID: formData.typeId,
      TEXT: formData.text,
      ReportToERP: false,
    })

  return res
})
