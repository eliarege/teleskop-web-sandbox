import { machineStore } from '../classes/MachineStore'
import { PError } from '../error'
import type { CopyItem } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  checkPermission(event, 'program-edit')
  const body = await readBody(event)

  if (event.method === 'POST') {
    const copyProgram: CopyItem = body.copyProgram
    const conflicts: CopyItem = { formMachineId: copyProgram.formMachineId, toMachineId: copyProgram.toMachineId, program: [] }

    const fromMachine = await machineStore.get(copyProgram.formMachineId)

    if (!fromMachine) {
      throw new PError('MACHINE_NOT_FOUND', { machineId: copyProgram.formMachineId })
    }

    const toMachine = (copyProgram.formMachineId === copyProgram.toMachineId)
      ? fromMachine
      : await machineStore.get(copyProgram.toMachineId)

    if (!toMachine) {
      throw new PError('MACHINE_NOT_FOUND', { machineId: copyProgram.toMachineId })
    }

    for (const program of copyProgram.program) {
      const isFromExist = await fromMachine.hasProgram(program.programNo)

      if (!isFromExist) {
        throw new PError('PROGRAM_NOT_FOUND', { machineId: copyProgram.formMachineId, programNo: program.programNo })
      }

      const targetProgramNo = program.newProgramNo ?? program.programNo
      const isToExist = await toMachine.hasProgram(targetProgramNo)

      if (isToExist) {
        conflicts.program.push({
          programNo: program.programNo,
          name: program.name,
          newProgramNo: null,
        })
      } else {
        const { program: fetchedProgram } = await fromMachine.fetchProgram(program.programNo)

        // Sadece newProgramNo varsa değiştirilir
        if (program.newProgramNo) {
          fetchedProgram.programNo = program.newProgramNo
        }

        await toMachine.insertProgram(fetchedProgram)
      }
    }

    return conflicts
  } else {
    throw createError({ statusCode: 405, statusMessage: `Method ${event.method} not allowed.` })
  }
})
