import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { id, reasonText } = await readBody(event)

    const res = await knex('BFSTEPSKIPPINGREASONS').where('ID', id)
      .update({
        REASONTEXT: reasonText,
      })

    return res

})
