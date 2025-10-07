import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  try {
    const { sourceMachineId, targetMachineId } = await readBody(event)

    if (!sourceMachineId || !targetMachineId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MISSING_MACHINE_IDS',
      })
    }

    if (sourceMachineId === targetMachineId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'SAME_MACHINE_COPY_NOT_ALLOWED',
      })
    }

    const result = await knex.transaction(async (trx) => {
      // Check if source machine exists and has reasons
      const sourceReasons = await trx('BFCOMMANDTIMEOUTREASONMAP')
        .where('MACHINEID', sourceMachineId)

      if (sourceReasons.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'NO_REASONS_TO_COPY',
        })
      }

      // Get filtered reason map for target machine commands
      const filteredReasonMap = await trx('BFCOMMANDTIMEOUTREASONMAP')
        .where('MACHINEID', sourceMachineId)
        .whereIn('COMMANDNO', trx('BFMASTERCOMMANDS')
          .where('MACHINEID', targetMachineId)
          .select('COMMANDNO'))

      // Delete existing mappings for target machine
      await trx('BFCOMMANDTIMEOUTREASONMAP')
        .where('MACHINEID', targetMachineId)
        .del()

      // Insert new mappings if any
      if (filteredReasonMap.length > 0) {
        await trx('BFCOMMANDTIMEOUTREASONMAP')
          .insert(filteredReasonMap.map(r => ({
            REASONID: r.REASONID,
            MACHINEID: targetMachineId,
            COMMANDNO: r.COMMANDNO,
          })))
      }

      return filteredReasonMap
    })

    return { success: true, copiedCount: result.length }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'COPY_OPERATION_FAILED',
    })
  }
})
