import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {

    const materials = await knex('DYTFMATERIAL')
      .select({
        materialCode: 'MATERIALCODE',
        materialName: 'MATERIALNAME',
        materialGroupNo: 'MADDEGRUPNO',
        density: 'YOGUNLUK',
        ph: 'PH',
        weighing: 'TARTIM',
        source: 'SOURCE',
        costUnit: 'MALIYETBIRIMI',
        unitCost: 'BIRIMMALIYET',
        archived: 'ARCHIVED',
        reRequestable: 'ReRequestable',
        directTransfer: 'DirectTransfer',
      })

    return materials

})
