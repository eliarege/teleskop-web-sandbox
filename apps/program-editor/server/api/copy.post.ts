import { machineStore } from '../classes/MachineStore'
import { PError } from '../error'
import { ProgramStatus } from '~/shared/constants'
import type { CopyItem } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  checkPermission(event, 'program-edit')
  const body = await readBody(event)

  const copyProgram: CopyItem = body.copyProgram
  const conflicts: CopyItem = { fromMachineId: copyProgram.fromMachineId, toMachineId: copyProgram.toMachineId, program: [] }

  const fromMachine = await machineStore.get(copyProgram.fromMachineId)

  if (!fromMachine) {
    throw new PError('MACHINE_NOT_FOUND', { machineId: copyProgram.fromMachineId })
  }

  const toMachine = (copyProgram.fromMachineId === copyProgram.toMachineId)
    ? fromMachine
    : await machineStore.get(copyProgram.toMachineId)

  if (!toMachine) {
    throw new PError('MACHINE_NOT_FOUND', { machineId: copyProgram.toMachineId })
  }

  for (const program of copyProgram.program) {
    const isFromExist = await fromMachine.hasProgram(program.programNo)

    if (!isFromExist) {
      throw new PError('PROGRAM_NOT_FOUND', { machineId: copyProgram.fromMachineId, programNo: program.programNo })
    }

    const targetProgramNo = program.newProgramNo ?? program.programNo
    const isToExist = await toMachine.hasProgram(targetProgramNo)

    if (isToExist && !program.newProgramNo) {
      conflicts.program.push({
        programNo: program.programNo,
        name: program.name,
        newProgramNo: null,
      })
    } else if (isToExist && program.newProgramNo) {
      const { program: fetchedProgram } = await fromMachine.fetchProgram(program.programNo)
      await toMachine.updateProgram({ ...fetchedProgram, programNo: program.newProgramNo })
    } else {
      const { program: fetchedProgram } = await fromMachine.fetchProgram(program.programNo)

      if (program.newProgramNo) {
        fetchedProgram.programNo = program.newProgramNo
      }

      fetchedProgram.isChanged = false
      fetchedProgram.prgState = ProgramStatus.EXISTS_ONLY_ON_DATABASE
      fetchedProgram.updatedAtTBB = fetchedProgram.updatedAt

      await toMachine.insertProgram(fetchedProgram)
    }
  }

  return conflicts
})
