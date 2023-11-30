import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId, reasonId } = await getQuery(event)

    const selectedCommandIds = await knex('BFCOMMANDTIMEOUTREASONMAP').where({
      MACHINEID: machineId,
      REASONID: reasonId,
    }).select({
      commandNo: 'COMMANDNO',
    })

    return selectedCommandIds
  } catch (e) {
    return e
  }
})
