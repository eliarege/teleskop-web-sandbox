import type { Recipe } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { machineId } = getQuery(event)
  const { jobOrder } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/recipe`

  const recipe = $fetch<Recipe>(url, {
    query: { machineId, jobOrder },
  })
  return recipe
})
