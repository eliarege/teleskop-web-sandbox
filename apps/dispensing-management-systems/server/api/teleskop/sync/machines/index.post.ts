import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const teleskopData = await readBody(event)
    const machines: any[] = []
    const masterCommands: any[] = []
    const commandTypes: any[] = []
    const commandSteps: any[] = []

    teleskopData.machines?.forEach((data: any) => {
      const machine = {
        machine_id: data.machineId,
        machine_name: data.machineName,
        controller_type: data.controllerType,
      }
      machines.push(machine)
    })
    teleskopData.commandTypes?.forEach((data: any) => {
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
    teleskopData.commandSteps?.forEach((data: any) => {
      const commandStep = {
        machine_id: data.machineId,
        main_step: data.mainStep,
        parallel_step: data.parallelStep,
        program_no: data.programNo,
        command_no: data.commandNo,
      }
      commandSteps.push(commandStep)
    })
    const batchSize = 3000
    await batchInsert(dmsDB, machines, batchSize, 'MACHINE', 'machine_id')
    await batchInsert(dmsDB, masterCommands, batchSize, 'MASTER_COMMAND')
    await batchInsert(dmsDB, commandTypes, batchSize, 'COMMAND_TYPE')
    await batchInsert(dmsDB, commandSteps, batchSize, 'COMMAND_STEP')
  } catch (e) {
    console.error(e)
    return e
  }
})
