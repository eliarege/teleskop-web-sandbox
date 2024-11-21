import { knex } from '~/server/connectionPool'

interface TheoreticalWaterConsumption {
  MACHINEID: number
  COMMANDNO: number
  COMMANDIO?: number
  COMMANDIO2?: number
  COMMANDPRM?: number
}

export default defineAuthEventHandler(async (event) => {
  const { machineId, commandNo, commandIO, commandIO2, commandParameter } = await readBody(event)

  const insertData: Partial<TheoreticalWaterConsumption> = {}
  if (commandIO !== undefined)
    insertData.COMMANDIO = commandIO
  if (commandIO2 !== undefined)
    insertData.COMMANDIO2 = commandIO2
  if (commandParameter !== undefined)
    insertData.COMMANDPRM = commandParameter

  const exists = await knex('BFTHEORETICALWATERCONSUMPTION')
    .where('MACHINEID', machineId)
    .andWhere('COMMANDNO', commandNo)

  if (exists.length) {
    return await knex('BFTHEORETICALWATERCONSUMPTION')
      .where('MACHINEID', machineId)
      .andWhere('COMMANDNO', commandNo)
      .update(insertData)
  } else {
    insertData.MACHINEID = machineId
    insertData.COMMANDNO = commandNo

    return await knex('BFTHEORETICALWATERCONSUMPTION')
      .insert(insertData)
  }
})
