import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)
    const map = await knex('DYTFMATERIALTANKMAP')
      .leftJoin('DYTFMATERIAL', 'DYTFMATERIALTANKMAP.MATERIALCODE', 'DYTFMATERIAL.MATERIALCODE')
      // .leftJoin('BFMACHINETANKS', 'DYTFMATERIALTANKMAP.MACHINEID', 'BFMACHINETANKS.MACHINEID')
      .leftOuterJoin('BFMACHINETANKS', function () {
        this
          .on('BFMACHINETANKS.TANKNO', 'DYTFMATERIALTANKMAP.TANKNO')
          .andOn('BFMACHINETANKS.MACHINEID', 'DYTFMATERIALTANKMAP.MACHINEID')
      })
      .where('DYTFMATERIALTANKMAP.MACHINEID', machineId)
      .select({
        id: 'ID',
        machineId: 'DYTFMATERIALTANKMAP.MACHINEID',
        materialCode: 'DYTFMATERIALTANKMAP.MATERIALCODE',
        tankNo: 'DYTFMATERIALTANKMAP.TANKNO',
        preWater: 'PREWATER',
        betweenWater: 'BETWEENWATER',
        postWater: 'POSTWATER',
        materialName: 'MATERIALNAME',
        tankName: 'NAME',
      })

    return map
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})
