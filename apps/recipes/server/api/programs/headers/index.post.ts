import { dmsDB } from '~/server/connectionPool'
import type { ProgramHeader } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { program }: { program: ProgramHeader } = await readBody(event)

  try {
    await dmsDB.transaction(async (trx) => {
      const updatedRows = await trx('PROGRAM_HEADER')
        .where({
          machine_id: program.machineId,
          program_no: program.programNo,
        })
        .update({
          program_name: program.programName,
          program_type: program.programType,
          chem_requests: program.chemRequests,
          dye_requests: program.dyeRequests,
          salt_requests: program.saltRequests,
        })

      if (updatedRows === 0) {
        await trx('PROGRAM_HEADER').insert({
          machine_id: program.machineId,
          program_no: program.programNo,
          program_name: program.programName,
          program_type: program.programType,
          chem_requests: program.chemRequests,
          dye_requests: program.dyeRequests,
          salt_requests: program.saltRequests,
        })
      }
    })

    return { success: true }
  } catch (e: any) {
    console.error(e)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
