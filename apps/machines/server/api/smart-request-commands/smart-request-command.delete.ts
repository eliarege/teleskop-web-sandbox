import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId, commandTypeId, commandNo } = await readBody(event)

    return await knex('BFSMARTREQUESTCOMMANDS')
      .where('MACHINEID', machineId)
      .andWhere('COMMANDTYPE', commandTypeId)
      .del()
  } catch (err) {
    console.log('err = ', err)
    return err
  }
})
