import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const res = await knex('DYTFMATERIALTANKMAP')
      .leftJoin('DYTFMATERIAL', 'DYTFMATERIAL.MATERIALCODE', 'DYTFMATERIALTANKMAP.MATERIALCODE')
      .leftJoin('BFMACHINETANKS', 'BFMACHINETANKS.TANKNO', 'DYTFMATERIALTANKMAP.TANKNO')
      .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'DYTFMATERIALTANKMAP.MACHINEID')
      .select({
        materialId: 'ID',
        machineName: 'MACHINECODE',
        tankName: 'NAME',
        tankNo: 'DYTFMATERIALTANKMAP.TANKNO',
        materialCode: 'DYTFMATERIALTANKMAP.MATERIALCODE',
        materialName: 'MATERIALNAME',
        materialGroupNo: 'MADDEGRUPNO',
        preWater: 'PREWATER',
        betweenWater: 'BETWEENWATER',
        postWater: 'POSTWATER',
      })

    return res
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})
