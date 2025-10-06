import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, currentMachineId } = await readBody(event)

  let machinesQuery = knex('BFMACHINES')
    .where('MACHINEID', machineId)

  if (currentMachineId) {
    machinesQuery = machinesQuery.whereNot('MACHINEID', currentMachineId)
  }

  const existingMachine = await machinesQuery.first()
  const isDuplicate = !!existingMachine

  return {
    isDuplicate,
  }
})
