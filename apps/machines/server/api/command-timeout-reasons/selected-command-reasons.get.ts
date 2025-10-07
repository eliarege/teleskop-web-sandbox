import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { machineId, commandNo } = getQuery(event)

    if (!machineId || !commandNo) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MISSING_MACHINE_OR_COMMAND',
      })
    }

    const reasonIds = await knex('BFCOMMANDTIMEOUTREASONMAP')
      .where('MACHINEID', machineId)
      .andWhere('COMMANDNO', commandNo)
      .select('REASONID')

    if (reasonIds.length === 0) {
      return []
    }

    const timeoutReasons = await knex('BFCOMMANDTIMEOUTREASONS')
      .whereIn('ID', reasonIds.map(r => r.REASONID))
      .where('ISDELETED', 0)
      .select(
        { id: 'ID', reasonText: 'REASONTEXT' },
      )

    return timeoutReasons
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'FETCH_SELECTED_REASONS_FAILED',
    })
  }
})
