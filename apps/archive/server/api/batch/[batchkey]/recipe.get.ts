import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  const planKey = (await db('BADATA as B')
    .join('DYBFBATCHPLAN as D', function () {
      this.on('D.JOBORDER', '=', 'B.JOBORDER')
    })
    .where('B.BATCHKEY', batchKey)
    .andWhere('D.lastForJoborder', 1)
    .first('D.PLANKEY')).PLANKEY

  // Define a subquery to sum the amounts for each relevant combination
  const consumptionSubQuery = db('DYTACONSUMPTION as c')
    .select('c.JOBORDERCODE', 'c.programOrder', 'c.programReqOrder', 'c.MATERIALCODE')
    .sum('c.AMOUNT as totalAmount')
    .groupBy('c.JOBORDERCODE', 'c.programOrder', 'c.programReqOrder', 'c.MATERIALCODE')

  return await db('dbo.DYBFBATCHORDERRECIPESTEPS as r')
    .where('r.PLANKEY', planKey)
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
      amount: 'totalAmount',
      unit: 'r.otherUnit',
      programNo: 'p.RECIPENO',
      recipeAmount: 'r.AMOUNT',
    })
    .leftJoin('dbo.DYBFBATCHORDERRECIPEHEADER as p', function () {
      this.on('r.PLANKEY', '=', 'p.PLANKEY')
        .andOn('r.RCPINDEX', '=', 'p.RCPINDEX')
        .andOn('r.RECIPETYPE', '=', 'p.RECIPETYPE')
    })
    .leftJoin('DYTFMATERIAL as m', 'm.MATERIALCODE', '=', 'r.CHEMCODE')
    .leftJoin(consumptionSubQuery.as('c'), function () {
      this.on('c.JOBORDERCODE', '=', 'r.JOBORDER')
        .andOn('c.programOrder', '=', 'r.RCPINDEX')
        .andOn('c.programReqOrder', '=', 'r.MAINSTEP')
        .andOn('c.MATERIALCODE', '=', 'r.CHEMCODE')
    })
    .whereNotNull('REQNO_BATCH')
    .orderBy(['r.RCPINDEX', 'r.REQNO_PROG', 'r.PARALLELSTEP'])
})
