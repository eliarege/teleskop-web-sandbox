import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId, commandNo } = getQuery(event)
    return await knex('BFCOMMANDINPUTOUTPUTS')
      .where({
        MACHINEID: machineId,
        COMMANDNO: commandNo,
      })
      .select({
        ioIndex: 'IOINDEX',
        ioId: 'IOID',
        ioType: 'IOTYPE',
        name: 'NAME',
        programEditing: 'PROGRAMEDITING',
        commandRun: 'COMMANDRUN',
      })
  } catch (e) {
    return e
  }
})
