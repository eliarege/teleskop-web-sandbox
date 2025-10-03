import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { changedReasons } = await readBody(event)

    if (!changedReasons || !Array.isArray(changedReasons) || changedReasons.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'NO_CHANGES_PROVIDED',
      })
    }

    await knex.transaction(async (trx) => {
      for (const reason of changedReasons) {
        const { id, machineId, commandNo, checked } = reason

        if (!id || !machineId || !commandNo) {
          throw createError({
            statusCode: 400,
            statusMessage: 'MISSING_REQUIRED_FIELDS',
          })
        }

        if (checked) {
          // Check if mapping already exists
          const existing = await trx('BFCOMMANDTIMEOUTREASONMAP')
            .where({
              REASONID: id,
              MACHINEID: machineId,
              COMMANDNO: commandNo,
            })
            .first()

          if (!existing) {
            await trx('BFCOMMANDTIMEOUTREASONMAP').insert({
              REASONID: id,
              MACHINEID: machineId,
              COMMANDNO: commandNo,
            })
          }
        } else {
          await trx('BFCOMMANDTIMEOUTREASONMAP').where({
            REASONID: id,
            MACHINEID: machineId,
            COMMANDNO: commandNo,
          }).del()
        }
      }
    })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'SAVE_OPERATION_FAILED',
    })
  }
})
