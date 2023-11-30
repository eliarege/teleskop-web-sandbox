import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId, commandNo } = await readBody(event)

    const res = await knex('BFSTEPSKIPPINGREASONCOMMANDS').where({
      MACHINEID: machineId,
      COMMANDNO: commandNo,
    }).del()

    return res
  } catch (e) {
    return e
  }
})
