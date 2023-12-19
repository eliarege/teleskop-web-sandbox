import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)

    const tanks = await knex('BFMACHINETANKS')
      .where('MACHINEID', machineId).select({
        machineId: 'MACHINEID',
        tankName: 'NAME',
        tankNo: 'TANKNO',
      })
    const map = tanks.map(async (tank) => {
      const materials = await knex('DYTFMATERIALTANKMAP')
        .leftOuterJoin('DYTFMATERIAL', 'DYTFMATERIALTANKMAP.MATERIALCODE', 'DYTFMATERIAL.MATERIALCODE')
        .where('TANKNO', tank.tankNo)
        .select({
          materialId: 'ID',
          materialCode: 'DYTFMATERIALTANKMAP.MATERIALCODE',
          materialName: 'MATERIALNAME',
          materialGroupNo: 'MADDEGRUPNO',
          preWater: 'PREWATER',
          betweenWater: 'BETWEENWATER',
          postWater: 'POSTWATER',
        })

      return {
        ...tank,
        materials: materials.length > 0 ? materials : [],
      }
    })

    return Promise.all(map)
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})
