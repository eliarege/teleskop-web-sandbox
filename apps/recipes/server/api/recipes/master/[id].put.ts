import { dmsDB } from '~/server/connectionPool'
import type { RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { recipeHeader } = await readBody<{ recipeHeader: RecipeProgramMaster }>(event)
  const res = await dmsDB('RECIPE_MASTER').insert({
    recipe_id: recipeHeader.recipeId,
    machine_id: recipeHeader.machineId,
    recipe_name: recipeHeader.recipeName,
    recipe_group: recipeHeader.recipeGroup,
    recipe_comment: recipeHeader.comment,
    recipe_type: recipeHeader.recipeType,
    prep_time: new Date(),
    last_update: new Date
  })
  return res
})
