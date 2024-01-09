import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId, tank, materialCode } = await readBody(event)

  const res = await knex('DYTFMATERIALTANKMAP')
    .insert({
      MACHINEID: machineId,
      MATERIALCODE: materialCode,
      TANKNO: tank.tankNo,
    })

  return res
})
