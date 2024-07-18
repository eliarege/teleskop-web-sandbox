import { dmsDB, getTeleskopDB } from '~/server/connectionPool'

const machineParams = {
  machine_name: 'MACHINENAME',
  machine_id: 'MACHINEID',
  controller_type: 'CONTROLLERTYPE',
}
const masterCommandParams = {
  machine_id: 'MACHINEID',
  command_no: 'COMMANDNO',
  command_name: 'NAME',
}
const commandTypeParams = {
  machine_id: 'machineId',
  command_type: 'commandType',
  command_no: 'commandNo',
}
const commandStepParams = {
  machine_id: 'MACHINEID',
  program_no: 'PROGNO',
  main_step: 'MAINSTEP',
  parallel_step: 'PARALELSTEP',
  command_no: 'COMMANDNO',
}

export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()

    const machines = await teleskopDB('dbo.DYTFMACHINES')
      .select(machineParams)
    const masterCommands = await teleskopDB('dbo.BAMASTERCOMMANDS')
      .select(masterCommandParams)
    const commandTypes = await teleskopDB('dbo.BFCOMMANDTYPES')
      .select(commandTypeParams)
    const commandSteps = await teleskopDB('dbo.BFMASTERSTEPS')
      .select(commandStepParams)

    const batchSize = 3000
    await batchInsert(dmsDB, machines, batchSize, 'MACHINE', ['machine_id'])
    await batchInsert(dmsDB, masterCommands, batchSize, 'MASTER_COMMAND', ['machine_id', 'command_no'])
    await batchInsert(dmsDB, commandTypes, batchSize, 'COMMAND_TYPE')
    await batchInsert(dmsDB, commandSteps, batchSize, 'COMMAND_STEP')
  } catch (e) {
    console.error(e)
    return e
  }
})
