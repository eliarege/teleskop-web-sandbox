import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { reasonId, typeId, text } = await readBody(event)
    console.log('reasonId, typeId, text = ', reasonId, typeId, text)

    const res = await knex('BFDYLOTFINISHREASONS').where('REASONID', reasonId)
      .update({
        TYPEID: typeId.value,
        TEXT: text,
      })

    return res
  } catch (e) {
    return e
  }
})
