import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/recipe', router.handler)

router.get('/correction-number-by-parameter', defineAuthEventHandler(async (event) => {
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

// router.get('/correction-number-by-plankey', defineAuthEventHandler(async (event) => {
//   const { planKey } = getQuery(event)
//   const result = await knex('DYBFBATCHPLAN')
//     .where('PLANKEY', planKey)
//     .select('CORRECTIONNUMBER')
//     return result
// }))

router.get('/joborder', defineAuthEventHandler(async (event) => {
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
      recipeAmount: 'r.RECIPEAMOUNT',
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

router.put('/change-planned-machine', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
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
  },
}))

router.put('/change-recipe-amount', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event)
    const query = await knex('DYBFBATCHORDERRECIPESTEPS')
      .where('PLANKEY', body.planKey)
      .andWhere('REQNO_BATCH', body.ISN)
      .andWhere('CHEMCODE', body.chemCode)
      .update({
        AMOUNT: body.newAmount,
      })
    return query
  },
}))

router.post('/previous-requests', defineAuthEventHandler(async (event) => {
  const { joborder, programNo, mainStep } = await readBody(event)
  const query = await knex('DYTFCHEMREQUESTS')
    .where('BATCHNO', joborder)
    .andWhere('PROGRAMNO', programNo)
    .andWhere('PROGRAMSTEPNO', mainStep)
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

router.post('/check-tank-no-required', defineAuthEventHandler(async (event) => {
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

router.post('/programs-by-plankey', defineAuthEventHandler(async (event) => {
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

router.post('/recipe-manuals', defineAuthEventHandler(async (event) => {
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

router.post('/refresh-weighing-requests/:plankey', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const { plankey } = getRouterParams(event)
    const record = await knex('DYBFBATCHPLAN')
      .where('PLANKEY', Number(plankey))
      .select('PLANKEY', 'lastForJoborder', 'ISDELETED')
      .first()
    if (record && record.lastForJoborder && !record.ISDELETED) {
      try {
        await knex('DYBFBATCHPLAN').where('PLANKEY', Number(plankey)).update({
          REFRESHWEIGHINGREQUESTS: true,
        })
        return 1
      } catch (e) {
        return 0
      }
    } else return 0
  },
}))

router.post('/refresh-solving-requests/:plankey', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const { plankey } = getRouterParams(event)
    const record = await knex('DYBFBATCHPLAN').where('PLANKEY', Number(plankey)).first()
    if (record && record.lastForJoborder && !record.ISDELETED) {
      try {
        await knex('DYBFBATCHPLAN').where('PLANKEY', Number(plankey)).update({
          REFRESHSOLVINGREQUESTS: true,
        })
        return 1
      } catch (e) {
        return 0
      }
    } else return 0
  },
}))
