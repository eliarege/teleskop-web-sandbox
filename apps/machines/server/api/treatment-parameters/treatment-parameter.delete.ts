import { knex } from '~/server/connectionPool'
import type { TreatmentParameter } from '~/types'

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event)
  return await knex('BFTREATMENTPARAMETERS')
    .where({
      ID: id,
    }).del()
})
