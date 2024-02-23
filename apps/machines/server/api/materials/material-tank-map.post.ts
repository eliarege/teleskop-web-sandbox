import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { tankMap } = await readBody(event)

  for (const tank of tankMap) {
    await knex('DYTFMATERIALTANKMAP')
      .where({
        MACHINEID: tank.machineId,
        TANKNO: tank.tankNo,
      }).del()
    for (const material of tank.materials) {
      await knex('DYTFMATERIALTANKMAP')
        .insert({
          MACHINEID: tank.machineId,
          MATERIALCODE: material.materialCode,
          TANKNO: tank.tankNo,
        })
    }
  }
})
