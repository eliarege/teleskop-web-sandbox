import { knex } from '~/server/connectionPool'

export default defineAuthEventHandler(async (event) => {
  const { tankMap } = await readBody(event)

  await knex.transaction(async (trx) => {
    for (const tank of tankMap) {
      await trx('DYTFMATERIALTANKMAP')
        .where({
          MACHINEID: tank.machineId,
          TANKNO: tank.tankNo,
        }).del()
      for (const material of tank.materials) {
        await trx('DYTFMATERIALTANKMAP')
          .insert({
            MACHINEID: tank.machineId,
            MATERIALCODE: material.materialCode,
            TANKNO: tank.tankNo,
          })
      }
    }
  })
})
