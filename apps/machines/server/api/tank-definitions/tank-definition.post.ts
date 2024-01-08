import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const { machineId, tankNo, name, highLimit, machineConstantHighLimit } = await readBody(event)
    const res = await knex('BFMACHINETANKS')
      .insert({
        MACHINEID: machineId,
        TANKNO: tankNo,
        NAME: name,
        HIGHLIMIT: highLimit,
        MACHINECONSTANTHIGHLIMIT: machineConstantHighLimit,
      })

    return res

})
