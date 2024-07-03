import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const teleskopData = await readBody(event)
    const machines: any[] = []
    const masterCommands: any[] = []
    const commandTypes: any[] = []

    teleskopData.machines?.forEach((data: any) => {
      const commandType = {
        machine_id: data.machineId,
        command_type: data.commandType,
        command_no: data.commandNo,
      }
      commandTypes.push(commandType)
    })
    teleskopData.masterCommands?.forEach((data: any) => {
      const masterCommand = {
        machine_id: data.machineId,
        command_no: data.commandNo,
        command_name: data.commandName,
      }
      masterCommands.push(masterCommand)
    })
    const batchSize = 3000
    await batchInsert(dmsDB, machines, batchSize, 'MACHINE', 'machine_id')
    await batchInsert(dmsDB, masterCommands, batchSize, 'MASTER_COMMAND', 'machine_id')
    await batchInsert(dmsDB, commandTypes, batchSize, 'COMMAND_TYPE', 'machine_id')
  } catch (e) {
    console.error(e)
    return e
  }
})
