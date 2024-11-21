import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, commandNo } = getQuery(event)

  const reasonIds = await knex('BFCOMMANDTIMEOUTREASONMAP').where('MACHINEID', machineId)
    .andWhere('COMMANDNO', commandNo).select('REASONID')

  const timeoutReasons = await knex('BFCOMMANDTIMEOUTREASONS').whereIn('ID', reasonIds.map(r => r.REASONID))
    .select(
      { id: 'ID', reasonText: 'REASONTEXT' },
    )

  return timeoutReasons
})
