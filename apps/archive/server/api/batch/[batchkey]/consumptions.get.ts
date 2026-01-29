import { db } from '~/server/database'
import type { Consumptions } from '~/types/archive'

export default defineEventHandler(async (event): Promise<Consumptions> => {
  const batchKey = getBatchKeyParam(event)
  const consumptions = await db
    .from('BACONSUMPTION as C')
    .first({
      waterType1: 'C.WaterType1',
      waterType2: 'C.WaterType2',
      waterType3: 'C.WaterType3',
      waterType4: 'C.WaterType4',
      waterType5: 'C.WaterType5',
      waterType6: 'C.WaterType6',
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

  if (!consumptions) {
    return {
      waterType1: 0,
      waterType2: 0,
      waterType3: 0,
      waterType4: 0,
      waterType5: 0,
      waterType6: 0,
      waterTotal: 0,
      electricity: 0,
      steam: 0,
      steamPerWeight: 0,
      electricityPerWeight: 0,
      totalWaterPerWeight: 0,
    }
  } else {
    return consumptions
  }
})
