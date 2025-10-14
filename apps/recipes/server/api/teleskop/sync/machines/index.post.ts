import { dmsDB, getTeleskopDB } from '~/server/connectionPool'

const machineParams = {
  machine_name: 'MACHINENAME',
  machine_id: 'MACHINEID',
  controller_type: 'CONTROLLERTYPE',
}

const parameterGroupParams = {
  group_id: 'ID',
  group_name: 'GROUPNAME',
}

const machineGroupParams = {
  machine_id: 'MACHINEID',
  group_id: 'GROUPID',
}

const machineCommandParams = {
  machine_id: 'MACHINEID',
  command_no: 'COMMANDNO',
  command_name: 'NAME'
}

const machineCommandParameterParams = {
  machine_id: 'MACHINEID',
  command_no: 'COMMANDNO',
  parameter_index: 'PARAMETERINDEX',
  parameter_name: 'PARAMSTRING',
  value: 'VALUE'
}

export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()

    const machines = await teleskopDB('dbo.DYTFMACHINES')
      .select(machineParams)
    const parameterGroups = await teleskopDB('dbo.BFTREATMENTPARAMETERGROUPS')
      .select(parameterGroupParams)
    const machineGroups = await teleskopDB('dbo.BFTREATMENTPARAMETERGROUPMACHINES')
      .select(machineGroupParams)
    const machineCommands = await teleskopDB('dbo.BFMASTERCOMMANDS')
      .select(machineCommandParams)
    const machineCommandParameters = await teleskopDB('dbo.BFCOMMANDPARAMETERS')
      .select(machineCommandParameterParams)

    const batchSize = 3000
    await batchInsert(dmsDB, machines, batchSize, 'MACHINE', ['machine_id'])
    await batchInsert(dmsDB, parameterGroups, batchSize, 'PARAMETER_GROUP', ['group_id'])
    await batchInsert(dmsDB, machineGroups, batchSize, 'MACHINE_GROUP', ['machine_id'])
    await batchInsert(dmsDB, machineCommands, batchSize, 'MACHINE_COMMAND', ['machine_id', 'command_no'])
    await batchInsert(dmsDB, machineCommandParameters, batchSize, 'MACHINE_COMMAND_PARAMETER', ['machine_id', 'command_no', 'parameter_index'])
  } catch (e) {
    console.error(e)
    return e
  }
})
