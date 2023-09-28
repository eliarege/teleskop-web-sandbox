import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/recipe', router.handler)

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

router.get('/joborder', defineEventHandler(async (event) => {
  const { recipeJB } = getQuery(event)
  const planKey = knex('DYBFBATCHPLAN')
    .where('JOBORDER', recipeJB)
    .orderBy('PLANKEY', 'desc')
    .limit(1)
    .select('PLANKEY')

  const asd = await knex('dbo.DYBFBATCHORDERRECIPESTEPS as r')
    .where('PLANKEY', planKey)
    .select({
      planKey: 'r.PLANKEY',
      joborder: 'r.JOBORDER',
      recipeType: 'r.RECIPETYPE',
      processOrder: 'r.RCPINDEX',
      ISN: 'r.REQNO_BATCH',
      mainStep: 'r.MAINSTEP',
      parallelStep: 'r.PARALLELSTEP',
      chemCode: 'r.CHEMCODE',
      materialName: 'm.MATERIALNAME',
      programProcessNo: 'r.REQNO_PROG',
      amount: 'r.AMOUNT',
      unit: 'r.otherUnit',
      // programNo: 'p.RECIPENO'
    })
    // .leftJoin('dbo.DYBFBATCHORDERRECIPEHEADER as p', function () {
    //   this.on('r.PLANKEY', '=', 'p.PLANKEY')
    //     .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
    //     .andOn('r.RECIPETYPE', '=', 'p.RECIPETYPE')
    // })
    .leftJoin('DYTFMATERIAL as m', 'm.MATERIALCODE', '=', 'r.CHEMCODE')
    .whereNotNull('REQNO_BATCH')
    .orderBy(['r.RCPINDEX', 'r.REQNO_PROG', 'r.PARALLELSTEP'])

    /** FIXME: .join function 'cause .join does not work as expected???????? */
    const a = await knex('dbo.DYBFBATCHORDERRECIPEHEADER as p')
      .where('JOBORDER', '11428')
      .orderBy('RECIPENO', 'asc')
    asd.forEach(elem => {
      for(let i=0;i<a.length;i++) {
        if((elem.planKey === a[i].PLANKEY) && (elem.processOrder === a[i].RCPINDEX) && (elem.recipeType === a[i].RECIPETYPE)) {
          elem.programNo = a[i].RECIPENO
          break
        }
      }
    })
  return asd
}))
