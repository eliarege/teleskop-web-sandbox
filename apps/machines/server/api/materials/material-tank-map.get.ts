import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { machineId } = getQuery(event)

    const map = await knex('BFMACHINETANKS')
      .leftOuterJoin('DYTFMATERIALTANKMAP', function () {
        this
          .on('BFMACHINETANKS.TANKNO', 'DYTFMATERIALTANKMAP.TANKNO')
          .andOn('BFMACHINETANKS.MACHINEID', 'DYTFMATERIALTANKMAP.MACHINEID')
      })
      .leftOuterJoin('DYTFMATERIAL', 'DYTFMATERIALTANKMAP.MATERIALCODE', 'DYTFMATERIAL.MATERIALCODE')
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
      .unionAll(function () {
        this
          .select({
            id: 'ID',
            machineId: 'BFMACHINETANKS.MACHINEID',
            materialCode: knex.raw('NULL'),
            tankNo: 'BFMACHINETANKS.TANKNO',
            preWater: knex.raw('NULL'),
            betweenWater: knex.raw('NULL'),
            postWater: knex.raw('NULL'),
            materialName: knex.raw('NULL'),
            tankName: 'BFMACHINETANKS.NAME',
          })
          .from('BFMACHINETANKS')
          .leftJoin('DYTFMATERIALTANKMAP', function () {
            this
              .on('BFMACHINETANKS.TANKNO', 'DYTFMATERIALTANKMAP.TANKNO')
              .andOn('BFMACHINETANKS.MACHINEID', 'DYTFMATERIALTANKMAP.MACHINEID')
          })
          .whereNull('DYTFMATERIALTANKMAP.MACHINEID')
      })

    return map
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})
