import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)

  return await db
    .from('BACONSUMPTION as C')
    .first({
      waterType1: 'C.WaterType1',
      waterType2: 'C.WaterType2',
      waterType3: 'C.WaterType3',
      waterType4: 'C.WaterType4',
      waterTotal: 'C.WaterTotal',
      electricity: 'C.ELECTRICITY',
      steam: 'C.STEAM',
      steamPerWeight: db.raw('CASE WHEN D.FABRIC_WEIGHT > 0 THEN C.STEAM / D.FABRIC_WEIGHT ELSE 0 END'),
      electricityPerWeight: db.raw('CASE WHEN D.FABRIC_WEIGHT > 0 THEN C.ELECTRICITY / D.FABRIC_WEIGHT ELSE 0 END'),
      totalWaterPerWeight: db.raw('CASE WHEN D.FABRIC_WEIGHT > 0 THEN C.WaterTotal / D.FABRIC_WEIGHT ELSE 0 END'),
    })
    .where('C.BATCHKEY', batchKey)
    .join('BADATA as D', function () {
      this.on('D.BATCHKEY', '=', 'C.BATCHKEY')
    })
})
