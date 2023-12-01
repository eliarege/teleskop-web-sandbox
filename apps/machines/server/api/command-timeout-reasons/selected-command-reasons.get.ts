import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId, commandNo } = await getQuery(event)

    const reasonIds = await knex('BFCOMMANDTIMEOUTREASONMAP').where('MACHINEID', machineId)
      .andWhere('COMMANDNO', commandNo).select('REASONID')

    const timeoutReasons = await knex('BFCOMMANDTIMEOUTREASONS').whereIn('ID', reasonIds.map(r => r.REASONID))
      .select(
        { id: 'ID', reasonText: 'REASONTEXT' },
      )

    return timeoutReasons
  } catch (e) {
    return e
  }
})
