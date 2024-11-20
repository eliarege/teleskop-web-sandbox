import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, reasonId } = getQuery(event)

  const selectedCommandIds = await knex('BFCOMMANDTIMEOUTREASONMAP').where({
    MACHINEID: machineId,
    REASONID: reasonId,
  }).select({
    commandNo: 'COMMANDNO',
  })

  return selectedCommandIds
})
