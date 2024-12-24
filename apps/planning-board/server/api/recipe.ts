import type { Recipe } from '~/shared/types'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { machineId } = getQuery(event)
  const { jobOrder } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/recipe`

  const recipe = authFetch<Recipe>(url, {
    query: { machineId, jobOrder },
  })
  return recipe
})
