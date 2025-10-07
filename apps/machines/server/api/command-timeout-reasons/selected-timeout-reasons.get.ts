import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { machineId, reasonId } = getQuery(event)

    if (!machineId || !reasonId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MISSING_MACHINE_OR_REASON',
      })
    }

    const selectedCommandIds = await knex('BFCOMMANDTIMEOUTREASONMAP')
      .where({
        MACHINEID: machineId,
        REASONID: reasonId,
      })
      .select({
        commandNo: 'COMMANDNO',
      })

    return selectedCommandIds
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'FETCH_SELECTED_COMMANDS_FAILED',
    })
  }
})
