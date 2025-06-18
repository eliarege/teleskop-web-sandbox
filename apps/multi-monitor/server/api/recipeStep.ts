import { getRecipeStepMaterial } from '../queries'

export default defineEventHandler(async (event) => {
  const { planKey, recipeIndex, programNo } = getQuery(event)

  return getRecipeStepMaterial(planKey, recipeIndex, programNo)
})
