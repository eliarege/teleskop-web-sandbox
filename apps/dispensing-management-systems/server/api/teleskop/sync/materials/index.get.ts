import { getTeleskopDB } from '~/server/connectionPool'

const materialParams = {
  materialCode: 'MATERIALCODE',
  materialName: 'MATERIALNAME',
  materialGroupNo: 'MADDEGRUPNO',
  density: 'YOGUNLUK',
  ph: 'PH',
  source: 'SOURCE',
  costUnit: 'MALIYETBIRIMI',
  unitCost: 'BIRIMMALIYET',
  reRequestable: 'ReRequestable',
  directTransfer: 'DirectTransfer',
}

export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()

    const materials = await teleskopDB('dbo.DYTFMATERIAL')
      .select(materialParams)
    const res = await $fetch('/api/teleskop/sync/materials', { method: 'POST', body: { materials } })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
})
