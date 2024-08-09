import { machineStore } from '~/server/classes/MachineStore'
import { ProgramEditorActivityCodes } from '~/server/constants'
import { type ErrorProgramDetail, PError } from '~/server/error'
import { logEditorOperation } from '~/server/functions'

export default defineAuthEventHandler(async (event) => {
  const { machine_id, program_no } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)
  const machine = await machineStore.get(machineId)
  const query = getQuery(event)

  if (event.method === 'GET') {
    try {
      const program = await machine.fetchProgram(programNo)
      program.author = event.context.kauth?.name || ''
      return program
    } catch (error) {
      if (error instanceof PError) {
        if (error.code === 'PROGRAM_NOT_FOUND') {
          throw createError({ statusCode: 404, data: { code: error.code, detail: error.detail } })
        }
      }
    }
  } else if (event.method === 'DELETE') {
    if (query?.source) {
      const source = query.source.toString()
      if (source.includes('machine')) {
        try {
          await machine.deleteRemoteProgram(programNo)
        } catch (e) {}
      }
      if (source.includes('db')) {
        await logEditorOperation(ProgramEditorActivityCodes.PROGRAMDELETED, `Makine ${machineId}`, `Program No ${programNo}`)
        return await machine.deleteProgramFromDatabase(programNo)
      }
      return 1
    }
    return 0
  }
})
