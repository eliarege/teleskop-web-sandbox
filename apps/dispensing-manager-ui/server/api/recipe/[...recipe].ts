import { knex } from '~/server/connectionPool'

const router = createRouter()

router.get('/test', defineEventHandler(async (event) => {
  const { recipeJB, recipeID, teleskopType } = getQuery(event)

  try {
    const planKeySubquery = knex('DYBFBATCHPLAN')
      .where('JOBORDER', recipeJB)
      .orderBy('PLANKEY', 'desc')
      .limit(1)
      .select('PLANKEY')

    const query = knex
      .select({
        recIndex: 'p.RCPINDEX',
        recNo: 'p.RECIPENO',
        name: 'h.NAME',
        reqNumber: 'DYEREQUESTNUMBER',
        mainStep: 'MAINSTEP',
        parallelStep: 'PARALLELSTEP',
        recType: 'r.RECIPETYPE',
        chemCode: 'CHEMCODE',
        materialName: 'm.MATERIALNAME',
        amount: 'AMOUNT',
        reqBatchNo: 'REQNO_BATCH',
        reqProgNo: 'REQNO_PROG',
        phaseNo: 'PHASENO',
        phaseIndex: 'PHASEINDEX',
        unit: 'otherUnit',
      })
      .from('DYBFBATCHORDERRECIPESTEPS as r')
      .rightJoin('DYBFBATCHORDERRECIPEHEADER as p', function () {
        this.on('r.PLANKEY', '=', 'p.PLANKEY')
          .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
          .andOn('r.RECIPETYPE', '=', 'p.RECIPETYPE')
      })
      .leftJoin('BFMASTERPRGHEADER as h', function () {
        this.on('p.RECIPENO', '=', 'h.PROGNO')
          .andOn('h.MACHINEID', '=', recipeID)
      })
      .leftJoin('DYTFMATERIAL as m', 'm.MATERIALCODE', '=', 'r.CHEMCODE')
      .where('p.PLANKEY', '=', planKeySubquery)
      .whereNotNull('REQNO_BATCH')
      .orderBy(['p.RCPINDEX', 'DYEREQUESTNUMBER', 'PARALLELSTEP'])

    if (teleskopType !== 'washing') {
      const result = await query
      return result
    } else {
      // Adjust your code here for the 'washing' condition.
    }
  } catch (error) {
    console.error(error)
    // Consider returning an error response or rethrowing the error.
    throw error
  }
}))

export default useBase('/api', router.handler)
