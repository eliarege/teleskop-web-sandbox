import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  return await knex('BFSTEPSKIPPINGREASONCOMMANDS').where('MACHINEID', machineId).select({
    commandNo: 'COMMANDNO',
  })
})
