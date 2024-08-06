import { createRouter, useBase } from 'h3'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/dispenser', router.handler)

const selectParameters = {
  reqnumber: 'r.REQNUMBER',
  joborder: 'r.BATCHNO',
  batchCorrectionNo: 'r.BATCHCORRECTIONNO',
  machinename: 'm.MACHINENAME',
  machineid: 'm.MACHINEID',
  tankno: 'r.TANKNO',
  name: 'd.NAME',
  dispNo: 'd.DISPENSERID',
  programno: 'r.PROGRAMNO',
  programname: 'p.NAME',
  stepno: 'r.PROGRAMSTEPNO',
  recipeType: 'r.RECIPETYPE',
  recipeProcessNo: 'r.RECIPEINDEX',
  recipeStepNo: 'r.RECIPESTEPNO',
  status: 'r.STATUS',
  priority: 'r.PRIORTY',
  plankey: 'r.PLANKEY',
  terminal: 'r.TERMINAL',
  requestTime: 'r.REQUESTTIME',
  completionTime: 'r.COMPLETEDTIME',
}

router.post('/joborderlogs', defineAuthEventHandler(async (event) => {
  const { isCanceled } = getQuery(event)
  const body = await readBody(event)

  const result = knex('dbo.DYTFCHEMREQUESTS as r')
    .join('dbo.DYTFMACHINES as m', 'r.MACHINEID', 'm.MACHINEID')
    .leftJoin('dbo.DYTFDISPENSERSETTINGS as d', 'r.DISPENSERID', 'd.DISPENSERID')
    .leftJoin('dbo.BFMASTERPRGHEADER as p', function () {
      this
        .on('r.PROGRAMNO', '=', 'p.PROGNO')
        .andOn('r.MACHINEID', '=', 'p.MACHINEID')
    })
  // TODO: There are no duplicates but this is not the way how its done for sure
    .select(selectParameters)
    .limit(500)
    .where((builder) => {
      if (isCanceled && isCanceled === 'true') {
        builder.where('r.STATUS', 3)
          .orWhere('r.STATUS', 8)
          .orderBy('r.COMPLETEDTIME', 'desc')
      } else {
        builder.whereNot('r.STATUS', 3)
          .andWhereNot('r.STATUS', 8)
          .orderBy('r.REQUESTTIME', 'desc')
      }
    })
  if (isCanceled === 'false') {
    result.rightJoin('TFMACHINESTATUS as s', function () {
      this
        .on('r.BATCHNO', '=', 's.RUNNING_JOBORDER')
        .andOn('m.MACHINEID', '=', 's.MACHINEID')
    })
  }
  if (body.length > 0) {
    filtersToKnex(body, selectParameters, result)
  }
  return await result
}))

router.get('/requestmaterials', defineAuthEventHandler(async (event) => {
  const { reqnumber } = getQuery(event)
  const result = await knex('dbo.DYTFREQMATERIALS as r')
    .join('dbo.DYTFMATERIAL as m', function () {
      this
        .on('m.MATERIALCODE', '=', 'r.CHEMCODE')
    })
    .leftJoin('dbo.DYTFDISPENSERSETTINGS as d', 'r.DISPENSERID', 'd.DISPENSERID')
    .where('r.REQNUMBER', '=', Number(reqnumber))
    .select({
      materialName: 'm.MATERIALNAME',
      materialCode: 'r.CHEMCODE',
      name: 'd.NAME',
      amount: 'r.AMOUNT',
      status: 'r.STATUS',
    })

  return result
}))

router.put('/complete-program', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const result = await knex('DYTFCHEMREQUESTS')
    .where('REQNUMBER', body.reqNumber)
    .update({ STATUS: 3 })
  return result
}))

router.post('/check-status', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const status = await knex('DYBFBATCHPLAN')
    .where('JOBORDER', body.joborder)
    .andWhere('CORRECTIONNUMBER', body.correctionNo)
    .select('ISDELETED')
  return status[0].ISDELETED
}))

router.put('/retry-cancel-status-setter', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  await knex('DYTFCHEMREQUESTS')
    .where('REQNUMBER', body.reqNumber)
    .update({ STATUS: 8 })
  await knex('DYTFREQMATERIALS')
    .where('REQNUMBER', body.reqNumber)
    .update({ STATUS: 8 })
  return 1
}))

router.post('/total-step-count', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const result = await knex('DYBFBATCHORDERRECIPESTEPS')
    .where('PLANKEY', body.plankey)
    .andWhere('RCPINDEX', body.recipeProcessNo)
    .andWhere('RECIPETYPE', body.recipeType)
    .countDistinct('MAINSTEP as count')
  return result[0].count
}))
