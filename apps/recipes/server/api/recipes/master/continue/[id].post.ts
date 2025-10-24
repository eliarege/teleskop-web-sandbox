import { dmsDB } from '~/server/connectionPool'
import type { RecipeProgramMaster } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { recipe } = await readBody<{ recipe: RecipeProgramMaster }>(event)
  const res = await dmsDB('RECIPE_PROGRAM_MASTER').update({
    recipe_name: recipe.recipeName,
    recipe_group: recipe.recipeGroup,
    recipe_type: recipe.recipeType,
    recipe_comment: recipe.comment,
    prep_time: recipe.prepTime,
    last_update: new Date(),
    step_no: recipe.stepNo,
    program_no: recipe.programNo,
    is_passive: recipe.isPassive,
  }).where('recipe_id', id)
  return res
})
