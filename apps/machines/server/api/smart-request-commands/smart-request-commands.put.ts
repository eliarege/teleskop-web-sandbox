import { knex } from '~/server/connectionPool'
import { MSSQL_ERROR, isSQLError } from '~/server/lib/error'

export default defineAuthEventHandler(async (event) => {
  try {
    const { changedCommandTypes } = await readBody(event)

    for (const commandType of changedCommandTypes) {
      if (commandType.commandNo === -1) {
        // skip the "empty" option
        continue
      }
      const existingRecord = await knex('BFSMARTREQUESTCOMMANDS')
        .where('MACHINEID', commandType.machineId)
        .andWhere('COMMANDTYPE', commandType.id)
        .first()

      if (existingRecord) {
        await knex('BFSMARTREQUESTCOMMANDS')
          .where('MACHINEID', commandType.machineId)
          .andWhere('COMMANDTYPE', commandType.id)
          .update({
            COMMANDNO: commandType.commandNo,
          })
      } else
        await knex('BFSMARTREQUESTCOMMANDS')
          .insert({
            MACHINEID: commandType.machineId,
            COMMANDTYPE: commandType.id,
            COMMANDNO: commandType.commandNo,
          })
    }
    return { success: true }
  } catch (error: any) {
    if (isSQLError(error, MSSQL_ERROR.PRIMARY_KEY_VIOLATION)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Duplicate entry',
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Database error in stop-reason PUT:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
