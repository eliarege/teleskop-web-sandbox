import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { batchNo, correctionNo, recipeProcessNo } = getQuery(event)
  const planKey = dmsDB('BATCH_PLAN')
    .where('batch', batchNo)
    .andWhere('batch_correction_no', correctionNo)
    .select('plan_key')
  const result = await dmsDB('BATCH_RECIPE_STEP')
    .where('plan_key', planKey)
    .andWhere('process_order', recipeProcessNo)
    .countDistinct('main_step as count')
  return result[0].count
})
