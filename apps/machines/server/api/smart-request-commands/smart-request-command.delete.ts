import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, commandTypeId, commandNo } = await readBody(event)

  return await knex('BFSMARTREQUESTCOMMANDS')
    .where('MACHINEID', machineId)
    .andWhere('COMMANDTYPE', commandTypeId)
    .del()
})
