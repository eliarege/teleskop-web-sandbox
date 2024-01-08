import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, commandTypeId, commandNo } = await readBody(event)
  // insert or update if machineId and commandType exists

  const existingRecord = await knex('BFSMARTREQUESTCOMMANDS')
    .where('MACHINEID', machineId)
    .andWhere('COMMANDTYPE', commandTypeId)
    .first()

  if (existingRecord) {
    return await knex('BFSMARTREQUESTCOMMANDS')
      .where('MACHINEID', machineId)
      .andWhere('COMMANDTYPE', commandTypeId)
      .update({
        COMMANDNO: commandNo,
      })
  } else
    return await knex('BFSMARTREQUESTCOMMANDS')
      .insert({
        MACHINEID: machineId,
        COMMANDTYPE: commandTypeId,
        COMMANDNO: commandNo,
      })
})
