import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { reasonId } = await readBody(event)

    const res = await knex('BFSTEPSKIPPINGREASONS')
      .where('ID', reasonId).del()

    return res
  } catch (err) {
    console.error(err)
    return err
  }
})
