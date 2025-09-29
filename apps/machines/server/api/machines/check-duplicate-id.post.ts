import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, currentMachineId } = await readBody(event)

  let isDuplicate = false

  let machinesQuery = knex('BFMACHINES')
    .where('MACHINEID', machineId)
    .where('USEINTELESKOP', true)

  if (currentMachineId) {
    machinesQuery = machinesQuery.whereNot('MACHINEID', currentMachineId)
  }

  const existingMachine = await machinesQuery.first()
  if (existingMachine) {
    isDuplicate = true
  }

  if (!isDuplicate) {
    let otherMachinesQuery = knex('BFMACHINES')
      .where({
        MACHINEID: machineId,
        USEINTELESKOP: false,
      })

    if (currentMachineId) {
      otherMachinesQuery = otherMachinesQuery.whereNot('MACHINEID', currentMachineId)
    }

    const existingOtherMachine = await otherMachinesQuery.first()

    if (existingOtherMachine) {
      isDuplicate = true
    }
  }

  return {
    isDuplicate,
  }
})
