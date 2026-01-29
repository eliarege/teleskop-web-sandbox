import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)

  const waterUnit = (await db
    .from('BFMACHINES as M')
    .first({
      unit: 'C.CALIBUNIT',
    })
    .where('D.BATCHKEY', batchKey)
    .join('BADATA as D', function () {
      this.on('D.MACHINEID', '=', 'M.MACHINEID')
    })
    .join('BFMACHCOUNTER as C', function () {
      this.on('C.MACHINEID', '=', 'D.MACHINEID')
        .andOn('C.ID', '=', 'M.WATERCOUNTERID')
    }))
  const steamUnit = (await db
    .from('BFMACHINES as M')
    .first({
      unit: 'M.STEAMUNIT',
    })
    .where('D.BATCHKEY', batchKey)
    .join('BADATA as D', function () {
      this.on('D.MACHINEID', '=', 'M.MACHINEID')
    }))

  return {
    waterType1: waterUnit?.unit || 'lt',
    waterType2: waterUnit?.unit || 'lt',
    waterType3: waterUnit?.unit || 'lt',
    waterType4: waterUnit?.unit || 'lt',
    waterType5: waterUnit?.unit || 'lt',
    waterType6: waterUnit?.unit || 'lt',
    waterTotal: waterUnit?.unit || 'lt',
    electricity: 'kWh',
    steam: steamUnit?.unit || 'kg',
    steamPerWeight: 'kg/kg',
    electricityPerWeight: 'kWh/kg',
    totalWaterPerWeight: 'lt/kg',
  }
})
