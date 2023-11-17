/* eslint-disable ts/no-invalid-this */
import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'
import { filtersToKnex } from '~/shared/functions'

const router = createRouter()
export default useBase('/api/dispenser', router.handler)

const selectParameters = {
  reqnumber: 'r.REQNUMBER',
  joborder: 'r.BATCHNO',
  batchCorrectionNo: 'r.BATCHCORRECTIONNO',
  machinename: 'm.MACHINENAME',
  machineid: 'm.MACHINEID',
  tankno: 'r.TANKNO',
  dispenserName: 'd.NAME',
  programno: 'r.PROGRAMNO',
  programname: 'p.NAME',
  stepno: 'r.PROGRAMSTEPNO',
  recipeType: 'r.ACTUALRECIPETYPE',
  recipeProcessNo: 'r.RECIPEINDEX',
  recipeStepNo: 'r.RECIPESTEPNO',
  status: 'r.STATUS',
}

router.post('/joborderlogs', defineEventHandler(async (event) => {
  const { isCanceled, type } = getQuery(event)
  const body = await readBody(event)
  try {
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
      .orderBy('r.REQNUMBER', 'asc')
      .where((builder) => {
        // if (type === 'chem') {
        //   builder.where('r.ACTUALRECIPETYPE', '=', 0)
        // }
        // if (type === 'dye') {
        //   builder.where('r.ACTUALRECIPETYPE', '=', 1)
        // }
        if (isCanceled && isCanceled === 'true') {
          builder.where('r.STATUS', 3)
            .orWhere('r.STATUS', 8)
        } else {
          builder.whereNot('r.STATUS', 3)
            .andWhereNot('r.STATUS', 8)
        }
      })
    if (body.length > 0) {
      return await filtersToKnex(body, selectParameters, result)
    } else {
      result.limit(1000)
      return await result
    }
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
