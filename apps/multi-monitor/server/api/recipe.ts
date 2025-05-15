import { getDyeingRecipe, getWashingRecipe } from '../queries'

export default defineEventHandler(async (event) => {
  const { recipeJB, recipeID, teleskopType } = getQuery(event)

  if (typeof recipeJB !== 'string' || typeof recipeID !== 'string')
    return []

  const data
    = teleskopType === 'washing'
      ? await getWashingRecipe(recipeJB, recipeID)
      : await getDyeingRecipe(recipeJB, recipeID)

  return data
})
