import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId, commandNo, ioId } = getQuery(event)
    return await knex('BFCOMMANDINPUTOUTPUTS')
      .where({
        MACHINEID: machineId,
        COMMANDNO: commandNo,
        IOID: ioId,
      })
      .select({
        ioType: 'IOTYPE',
        name: 'NAME',
      })
  } catch (e) {
    return e
  }
})
