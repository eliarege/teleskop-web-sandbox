import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, formulaId } = getQuery(event)

  await knex('BFCOMMANDFORMULAS')
    .where({
      machineId,
      formulaId,
    })
    .del()
})
