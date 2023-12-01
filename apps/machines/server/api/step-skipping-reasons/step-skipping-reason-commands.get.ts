import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)
    return await knex('BFSTEPSKIPPINGREASONCOMMANDS').where('MACHINEID', machineId).select({
      commandNo: 'COMMANDNO',
    })
  } catch (err) {
    console.error(err)
  }
})
