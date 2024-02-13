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

router.get('/correction-number-by-parameter', defineEventHandler(async (event) => {
  const { parameter } = getQuery(event)
  const { searchBy } = getQuery(event)
  let result
  /** Returns correction no list */
  if (searchBy === 'recipeJB') {
    result = await knex('DYBFBATCHPLAN')
      .where('JOBORDER', parameter)
      .groupBy('CORRECTIONNUMBER')
      .orderBy('CORRECTIONNUMBER', 'asc')
      .select('CORRECTIONNUMBER')
  }
  /** Returns correction no of the spesific joborder's highest planKey */
  if (searchBy === 'planKey') {
    result = knex('DYBFBATCHPLAN')
      .where('JOBORDER', parameter)
      .orderBy('PLANKEY', 'desc')
      .limit(1)
      .select('CORRECTIONNUMBER')
  }
  return result
}))

// router.get('/correction-number-by-plankey', defineEventHandler(async (event) => {
//   const { planKey } = getQuery(event)
//   const result = await knex('DYBFBATCHPLAN')
//     .where('PLANKEY', planKey)
//     .select('CORRECTIONNUMBER')
//     return result
// }))

router.get('/joborder', defineEventHandler(async (event) => {
  const { recipeJB, correctionNo } = getQuery(event)
  let planKey
  if (Number(correctionNo)) {
    planKey = await knex('DYBFBATCHPLAN')
      .where('JOBORDER', recipeJB)
      .andWhere('CORRECTIONNUMBER', correctionNo)
      .select('PLANKEY')
  } else {
    planKey = await knex('DYBFBATCHPLAN')
      .where('JOBORDER', recipeJB)
      .orderBy('PLANKEY', 'desc')
      .limit(1)
      .select('PLANKEY')
  }
  if (!planKey.length) {
    return 0
  } else
    planKey = planKey[0].PLANKEY
  const machineid = (await knex('DYBFBATCHPLAN')
    .select('PLANNEDMACHINE')
    .where('PLANKEY', planKey))[0].PLANNEDMACHINE

  const asd = await knex('dbo.DYBFBATCHORDERRECIPESTEPS as r')
    .where('r.PLANKEY', planKey)
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
      programNo: 'p.RECIPENO',
      programName: 't.NAME',
    })
    .leftJoin('dbo.DYBFBATCHORDERRECIPEHEADER as p', function () {
      this.on('r.PLANKEY', '=', 'p.PLANKEY')
        .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
        .andOn('r.RECIPETYPE', '=', 'p.RECIPETYPE')
    })
    .leftJoin('dbo.BFMASTERPRGHEADER as t', function () {
      this
        .on('p.RECIPENO', '=', 't.PROGNO')
        .andOn('t.MACHINEID', '=', machineid)
    })
    .leftJoin('DYTFMATERIAL as m', 'm.MATERIALCODE', '=', 'r.CHEMCODE')
    .whereNotNull('REQNO_BATCH')
    .orderBy(['r.RCPINDEX', 'r.REQNO_PROG', 'r.PARALLELSTEP'])

  return asd
}))

router.put('/change-planned-machine', defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const query = knex('DYBFBATCHPLAN')
      .where('PLANKEY', body.plankey)
    query.update({
      PLANNEDMACHINE: body.newPlannedMachine,
    })
    if (body.isCoupled) {
      query.update({
        SLAVEMACHINEID: body.newCoupledMachine,
      })
    }
    return await query
  } catch (e) {
    return e
  }
}))

router.put('/change-recipe-amount', defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const query = await knex('DYBFBATCHORDERRECIPESTEPS')
      .where('PLANKEY', body.planKey)
      .andWhere('REQNO_BATCH', body.ISN)
      .andWhere('CHEMCODE', body.chemCode)
      .update({
        AMOUNT: body.newAmount,
      })
    return query
  } catch (e) {
    return e
  }
}))

router.post('/previous-requests', defineEventHandler(async (event) => {
  const { joborder, programNo, programStepNo } = await readBody(event)
  const query = await knex('DYTFCHEMREQUESTS')
    .where('BATCHNO', joborder)
    .andWhere('PROGRAMNO', programNo)
    .andWhere('PROGRAMSTEPNO', programStepNo)
    .select({
      joborder: 'BATCHNO',
      correctionNo: 'BATCHCORRECTIONNO',
      mainStep: 'PROGRAMSTEPNO',
      status: 'STATUS',
      requestTime: 'REQUESTTIME',
      endTime: 'COMPLETEDTIME',
    })
  return query
}))

router.post('/check-tank-no-required', defineEventHandler(async (event) => {
  const body = await readBody(event)

  const arr = await knex('DYTFCHEMDISPCONNECTION as C')
    .whereIn('C.CHEMCODE', body.materialCodes)
    .select('PROTOCOL')
    .join('DYTFDISPENSERSETTINGS as D', 'C.DISPENSERID', 'D.DISPENSERID')
  let check = false
  arr.forEach((a) => {
    if (['n-v2', 'n-v3', 'n-v4', 'n-v5'].includes(a.PROTOCOL))
      check = true
  })

  return check
}))

// router.post('/programs-with-materials', defineEventHandler(async (event) => {
//   const body = await readBody(event)
//   const steps = await knex('DYBFBATCHORDERRECIPESTEPS as S')
//     .select({
//       planKey: 'S.PLANKEY',
//       joborder: 'S.JOBORDER',
//       recipeType: 'S.RECIPETYPE',
//       processOrder: 'S.RCPINDEX',
//       ISN: 'S.REQNO_BATCH',
//       mainStep: 'S.MAINSTEP',
//       parallelStep: 'S.PARALLELSTEP',
//       materialCode: 'S.CHEMCODE',
//       materialName: 'M.MATERIALNAME',
//       programProcessNo: 'S.REQNO_PROG',
//       amount: 'S.AMOUNT',
//       unit: 'S.otherUnit',
//       programNo: 'H.RECIPENO',
//     })
//     .where('S.PLANKEY', body.plankey)
//     .leftJoin('DYBFBATCHORDERRECIPEHEADER as H', function () {
//       this.on('S.PLANKEY', '=', 'H.PLANKEY')
//         .andOn('S.RCPINDEX', '=', 'H.RCPINDEX')
//         .andOn('S.RECIPETYPE', '=', 'H.RECIPETYPE')
//     })
//     .leftJoin('DYTFMATERIAL as M', 'M.MATERIALCODE', '=', 'S.CHEMCODE')
//     .orderBy(['S.RCPINDEX', 'S.REQNO_PROG', 'S.PARALLELSTEP'])

//   return steps
// }))

router.post('/programs-by-plankey', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = await knex('DYBFBATCHORDERRECIPEHEADER')
    .where('PLANKEY', body.plankey)
    .select({
      recipeIndex: 'RCPINDEX',
      programNo: 'RECIPENO',
      recipeType: 'RECIPETYPE',
    })
  return result
}))

router.post('/recipe-manuals', defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await knex('DYBFBATCHORDERRECIPEMANUALS as A')
    .leftJoin('DYTFMATERIAL as B', 'B.MATERIALCODE', 'A.CHEMCODE')
    .leftJoin('DYBFBATCHPLAN as C', 'A.PLANKEY', 'C.PLANKEY')
    .leftJoin('BFMASTERPRGHEADER as T', function () {
      this
        .on('A.RECIPENO', '=', 'T.PROGNO')
        .andOn('T.MACHINEID', '=', 'C.PLANNEDMACHINE')
    })
    .where('A.PLANKEY', body.plankey)
    .where('C.CORRECTIONNUMBER', body.correctionNo)
    .orderBy('CallOffManuel', 'asc')
    // .select('A.*', 'B.MATERIALNAME', 'C.CORRECTIONNUMBER', 'C.PROGRAMNOLIST', 'C.PLANNEDMACHINE', 'C.ISCOUPLED', 'C.SLAVEMACHINEID', 'C.STARTEDMACHINEID')
    .select({
      planKey: 'A.PLANKEY',
      joborder: 'A.JOBORDER',
      recipeType: 'A.RECIPETYPE',
      processOrder: 'A.RCPINDEX',
      ISN: 'A.REQNO_BATCH',
      mainStep: 'A.MAINSTEP',
      parallelStep: 'A.PARALLELSTEP',
      chemCode: 'A.CHEMCODE',
      materialName: 'B.MATERIALNAME',
      programProcessNo: 'A.REQNO_PROG',
      amount: 'A.AMOUNT',
      unit: 'A.otherUnit',
      programNo: 'A.RECIPENO',
      programName: 'T.NAME',
      // 'C.ISCOUPLED',
      // 'C.SLAVEMACHINEID',
      // 'C.STARTEDMACHINEID'
    })
  return result
}))
