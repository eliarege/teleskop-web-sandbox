import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { reasonId, reasonText, oldReasonId } = await readBody(event)

    const res = await knex('BFSTEPSKIPPINGREASONS')
      .where('ID', oldReasonId)
      .update({
        ID: reasonId,
        REASONTEXT: reasonText,
      })

    return res
  } catch (err) {
    console.error(err)
    return err
  }
})
