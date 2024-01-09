import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { id, typeName } = await readBody(event)

    const res = await knex('BFRECIPETYPES').where('ID', id)
      .update({
        TYPENAME: typeName,
      })

    return res

})
