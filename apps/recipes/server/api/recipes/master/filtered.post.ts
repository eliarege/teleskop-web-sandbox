import { filtersToKnex } from '@teleskop/utils'
import { dmsDB } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { filters } = await readBody(event)
  const selectParams = {
    recipeId: 'recipe_id',
    recipeName: 'recipe_name',
    machineId: 'machine_id',
    colorCode: 'color_code',
    colorName: 'color_name',
    lastUpdate: 'last_update',
    prepTime: 'prep_time'
  }
  const recipes = dmsDB('RECIPE_MASTER')
    .select(selectParams)
    .orderBy(['machine_id', 'recipe_id'])
  if (filters)
    filtersToKnex(filters, selectParams, recipes)
  return await recipes
})
