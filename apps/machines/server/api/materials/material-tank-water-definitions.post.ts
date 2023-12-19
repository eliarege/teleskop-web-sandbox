import { filtersToKnex } from 'utils/index'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  try {
    const { filters } = await readBody(event)

    const selectParams = {
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
    }

    const query = knex('DYTFMATERIALTANKMAP')
      .leftJoin('DYTFMATERIAL', 'DYTFMATERIAL.MATERIALCODE', 'DYTFMATERIALTANKMAP.MATERIALCODE')
      .leftJoin('BFMACHINETANKS', 'BFMACHINETANKS.TANKNO', 'DYTFMATERIALTANKMAP.TANKNO')
      .leftJoin('BFMACHINES', 'BFMACHINES.MACHINEID', 'DYTFMATERIALTANKMAP.MACHINEID')
      .select(selectParams)
    console.log('filters = ', filters)
    if (filters)
      return await filtersToKnex(filters, selectParams, query)

    return await query
  } catch (e) {
    console.log('e = ', e)
    return e
  }
})
