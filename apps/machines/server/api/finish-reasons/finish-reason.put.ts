import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { reasonId, typeId, text } = await readBody(event)

  const res = await knex('BFDYLOTFINISHREASONS').where('REASONID', reasonId)
    .update({
      TYPEID: typeId.value,
      TEXT: text,
    })

  return res
})
