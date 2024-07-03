import { getTeleskopDB } from '~/server/connectionPool'

const machineParams = {
  machineName: 'MACHINENAME',
  machineId: 'MACHINEID',
  controllerType: 'CONTROLLERTYPE',
}
const masterCommandParams = {
  machineId: 'MACHINEID',
  commandNo: 'COMMANDNO',
  commandName: 'NAME'
}
const commandTypeParams = {
  machineId: 'machineId',
  commandType: 'commandType',
  commandNo: 'commandNo'
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
    $fetch('/api/teleskop/sync/machines', { method: 'POST', body: { machines, masterCommands, commandTypes } })
  } catch (e) {
    console.log(e)
    return e
  }
})
