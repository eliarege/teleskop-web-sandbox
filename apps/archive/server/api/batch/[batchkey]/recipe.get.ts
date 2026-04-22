import { db } from '~/server/database'
import type { RecipeStep } from '~/types/archive'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)

  if (!batchKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    })
  }

  const consumptionSubQuery = db('DYTACONSUMPTION as c')
    .select(
      'c.JOBORDERCODE',
      'c.programOrder',
      'c.programReqOrder',
      'c.MATERIALCODE',
    )
    .sum({ totalAmount: 'c.AMOUNT' })
    .groupBy(
      'c.JOBORDERCODE',
      'c.programOrder',
      'c.programReqOrder',
      'c.MATERIALCODE',
    )

  const result: RecipeStep[] = await db('dbo.DYBFBATCHORDERRECIPESTEPS as r')
    .select({
      jobOrder: 'r.JOBORDER',
      recipeType: 'r.RECIPETYPE',
      processOrder: 'r.RCPINDEX',
      ISN: 'r.REQNO_BATCH',
      mainStep: 'r.MAINSTEP',
      parallelStep: 'r.PARALLELSTEP',
      chemCode: 'r.CHEMCODE',
      materialName: 'm.MATERIALNAME',
      programProcessNo: 'r.REQNO_PROG',
      amount: 'c.totalAmount',
      unit: 'r.otherUnit',
      programNo: 'p.RECIPENO',
      recipeAmount: 'r.AMOUNT',
    })
    .join('BADATA as B', 'B.JOBORDER', 'r.JOBORDER')
    .join('DYBFBATCHPLAN as D', function () {
      this.on('D.JOBORDER', '=', 'B.JOBORDER')
        .andOn('D.lastForJoborder', '=', db.raw('1'))
    })
    .leftJoin('dbo.DYBFBATCHORDERRECIPEHEADER as p', function () {
      this.on('r.PLANKEY', '=', 'p.PLANKEY')
        .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
        .andOn('r.RECIPETYPE', '=', 'p.RECIPETYPE')
    })
    .leftJoin('DYTFMATERIAL as m', 'm.MATERIALCODE', 'r.CHEMCODE')
    .leftJoin(consumptionSubQuery.as('c'), function () {
      this.on('c.JOBORDERCODE', '=', 'r.JOBORDER')
        .andOn('c.programOrder', '=', 'r.RCPINDEX')
        .andOn('c.programReqOrder', '=', 'r.MAINSTEP')
        .andOn('c.MATERIALCODE', '=', 'r.CHEMCODE')
    })
    .where('B.BATCHKEY', batchKey)
    .whereNotNull('r.REQNO_BATCH')
    .orderBy([
      { column: 'r.RCPINDEX' },
      { column: 'r.REQNO_PROG' },
      { column: 'r.PARALLELSTEP' },
    ])

  return result
})
