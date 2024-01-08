import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, commandNo } = await readBody(event)

  const res = await knex('BFSTEPSKIPPINGREASONCOMMANDS').where({
    MACHINEID: machineId,
    COMMANDNO: commandNo,
  }).del()

  return res
})
