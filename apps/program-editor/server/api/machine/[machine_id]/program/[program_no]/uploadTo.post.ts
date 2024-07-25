import { machineStore } from '~/server/classes/MachineStore'

export default defineEventHandler(async (event) => {
  const { machine_id, program_no } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const programNo = Number.parseInt(program_no)
  const body = await readBody(event)
  const machineOfProgram = await machineStore.get(machineId)
  const machineToUpload = await machineStore.get(body.machineId)
  const program = await machineOfProgram.fetchProgram(programNo)
  return await machineToUpload.uploadProgram(program)
})
