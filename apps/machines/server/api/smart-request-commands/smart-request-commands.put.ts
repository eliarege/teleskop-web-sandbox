import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { changedCommandTypes } = await readBody(event)

  for (const commandType of changedCommandTypes) {
    const existingRecord = await knex('BFSMARTREQUESTCOMMANDS')
      .where('MACHINEID', commandType.machineId)
      .andWhere('COMMANDTYPE', commandType.id)
      .first()

    if (existingRecord) {
      await knex('BFSMARTREQUESTCOMMANDS')
        .where('MACHINEID', commandType.machineId)
        .andWhere('COMMANDTYPE', commandType.id)
        .update({
          COMMANDNO: commandType.commandNo,
        })
    } else
      await knex('BFSMARTREQUESTCOMMANDS')
        .insert({
          MACHINEID: commandType.machineId,
          COMMANDTYPE: commandType.id,
          COMMANDNO: commandType.commandNo,
        })
  }
})
