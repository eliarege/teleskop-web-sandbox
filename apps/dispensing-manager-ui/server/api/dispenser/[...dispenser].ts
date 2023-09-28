import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/dispenser', router.handler)

router.get('/joborderlogs', defineEventHandler(async (event) => {
  let result
  const { isCanceled } = getQuery(event)
  console.log(isCanceled)
  try {
    const query: any = knex('dbo.DYTFCHEMREQUESTS as r')
      .join('dbo.DYTFMACHINES as m', 'r.MACHINEID', 'm.MACHINEID')
      .leftJoin('dbo.DYTFDISPENSERSETTINGS as d', 'r.DISPENSERID', 'd.DISPENSERID')
      .leftJoin('dbo.BFMASTERPRGHEADER as p', function () {
        this
          .on('r.PROGRAMNO', '=', 'p.PROGNO')
          .andOn('r.MACHINEID', '=', 'p.MACHINEID')
      })
      .select({ // TODO: There are no duplicates but this is not the way how its done for sure
        reqnumber: 'r.REQNUMBER',
        joborder: 'r.BATCHNO',
        batchCorrectionNo: 'r.BATCHCORRECTIONNO',
        machinename: 'm.MACHINENAME',
        tankno: 'r.TANKNO',
        dispenserName: 'd.NAME',
        programno: 'r.PROGRAMNO',
        programname: 'p.name',
        stepno: 'r.PROGRAMSTEPNO',
        recipeType: 'r.ACTUALRECIPETYPE',
        recipeProcessNo: 'r.RECIPEINDEX',
        recipeStepNo: 'r.RECIPESTEPNO',
        status: 'r.STATUS',
      })
      .limit(1000)
      .orderBy('r.REQNUMBER', 'asc')
    // .whereNot('r.STATUS', 3)
    // .andWhereNot('r.STATUS', 8)

    if (isCanceled && isCanceled === 'true') {
      console.log(1231231231231)
      result = await query.where('r.STATUS', 3)
        .orWhere('r.STATUS', 8)
    } else {
      console.log(1230)
      result = await query.whereNot('r.STATUS', 3)
        .andWhereNot('r.STATUS', 8)
    }

    return result
  } catch (e) {
    return e
  }
}))

router.get('/requestmaterials', defineEventHandler(async (event) => {
  let result
  const { reqnumber } = getQuery(event)
  try {
    result = await knex('dbo.DYTFREQMATERIALS as r')
      .join('dbo.DYTFMATERIAL as m', function () {
        this
          .on('m.MATERIALCODE', '=', 'r.CHEMCODE')
      })
      .leftJoin('dbo.DYTFDISPENSERSETTINGS as d', 'r.DISPENSERID', 'd.DISPENSERID')
      .where('r.REQNUMBER', '=', Number(reqnumber))
      .select({
        materialName: 'm.MATERIALNAME',
        materialCode: 'r.CHEMCODE',
        dispenserName: 'd.NAME',
        amount: 'r.AMOUNT',
        status: 'r.STATUS',
      })

    return result
  } catch (e) {
    return e
  }
}))

/**
 * import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool';

const router = createRouter()

router.get('/test', defineEventHandler(async (event) => {
  let result;
  try {
    result = await knex('dbo.DYTFCHEMREQUESTS as r')
    .join('dbo.DYTFMACHINES as m', 'r.MACHINEID', 'm.MACHINEID')
    .leftJoin('dbo.DYTFDISPENSERSETTINGS as d', 'r.DISPENSERID', 'd.DISPENSERID')
    .leftJoin('dbo.BFMASTERPRGHEADER as p', function() {
      this
        .on('r.PROGRAMNO', '=', 'p.PROGNO')
        .andOn('r.MACHINEID', '=', 'p.MACHINEID')
    })
    .select({ //TODO: There are no duplicates but this is not the way how its done for sure
      reqnumber: 'r.REQNUMBER',
      joborder: knex.raw('MAX(r.BATCHNO)'),
      batchCorrectionNo: knex.raw('MAX(r.BATCHCORRECTIONNO)'),
      machinename: knex.raw('MAX(m.MACHINENAME)'),
      tankno: knex.raw('MAX(r.TANKNO)'),
      dispenserName: knex.raw('MAX(d.NAME)'),
      programno: knex.raw('MAX(r.PROGRAMNO)'),
      programname: knex.raw('MAX(p.NAME)'),
      stepno: knex.raw('MAX(r.PROGRAMSTEPNO)'),
      recipeType: knex.raw('MAX(r.ACTUALRECIPETYPE)'),
      recipeProcessNo: knex.raw('MAX(r.RECIPEINDEX)'),
      recipeStepNo: knex.raw('MAX(r.RECIPESTEPNO)'),
    })
    .limit(10)
    .orderBy('r.REQNUMBER', 'asc')
    .groupBy('r.REQNUMBER')

    return result
  }
  catch (e) {
    return e
  }
}))
 */
