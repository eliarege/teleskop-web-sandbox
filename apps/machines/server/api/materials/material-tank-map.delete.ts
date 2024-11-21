import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { machineId, tank, materialCode } = await readBody(event)

  const res = await knex('DYTFMATERIALTANKMAP')
    .where({
      MACHINEID: machineId,
      MATERIALCODE: materialCode,
      TANKNO: tank.tankNo,
    }).del()

  return res
})
