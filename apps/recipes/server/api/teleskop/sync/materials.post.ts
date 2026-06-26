import { dmsDB, getTeleskopDB } from '~/server/connectionPool'

const materialParams = {
  material_code: 'MATERIALCODE',
  material_name: 'MATERIALNAME',
  material_group_no: 'MADDEGRUPNO',
  density: 'YOGUNLUK',
  ph: 'PH',
  source: 'SOURCE',
  cost_unit: 'MALIYETBIRIMI',
  unit_cost: 'BIRIMMALIYET',
  re_requestable: 'ReRequestable',
  direct_transfer: 'DirectTransfer',
  is_manual: 'MANUALMATERIAL'
}

export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()
    const materials = await teleskopDB('dbo.DYTFMATERIAL')
      .select(materialParams)
    const batchSize = 3000
    await batchInsert(dmsDB, materials, batchSize, 'MATERIAL', ['material_code'])
    return ''
  } catch (e) {
    console.error(e)
    return e
  }
})
