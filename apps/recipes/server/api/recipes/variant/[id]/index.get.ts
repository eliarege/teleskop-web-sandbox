import { dmsDB } from '~/server/connectionPool'
import type { RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { machineId } = getQuery(event)
  const variants: Array<RecipeProgramMaster> = await dmsDB('RECIPE_VARIANT').select({
    recipeId: 'recipe_id',
    variantName: 'variant_name',
    colorCode: 'color_code',
    colorName: 'color_name'
  }).where('recipe_id', '=', id).andWhere('machine_id', machineId)
  return variants
})
