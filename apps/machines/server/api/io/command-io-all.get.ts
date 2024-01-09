import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { machineId, commandNo } = getQuery(event)
    return await knex('BFCOMMANDINPUTOUTPUTS')
      .where({
        MACHINEID: machineId,
        COMMANDNO: commandNo,
      })
      .select({
        machineId: 'MACHINEID',
        commandNo: 'COMMANDNO',
        ioIndex: 'IOINDEX',
        ioId: 'IOID',
        ioType: 'IOTYPE',
        name: 'NAME',
        programEditing: 'PROGRAMEDITING',
        commandRun: 'COMMANDRUN',
      })

})
