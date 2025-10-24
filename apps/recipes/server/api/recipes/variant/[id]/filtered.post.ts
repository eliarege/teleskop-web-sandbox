import { filtersToKnex } from '@teleskop/utils'
import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { machineId } = getQuery(event)
  const { filters } = await readBody(event)
  const selectParams = ({
    recipeId: 'recipe_id',
    variantName: 'variant_name',
    colorCode: 'color_code',
    colorName: 'color_name',
  })
  const variants = dmsDB('RECIPE_VARIANT')
    .select(selectParams)
    .where('recipe_id', '=', id)
    .andWhere('machine_id', machineId)
  if (filters)
    filtersToKnex(filters, selectParams, variants)
  return await variants
})
