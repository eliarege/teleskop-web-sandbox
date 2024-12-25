import { useKcFetch } from '../utils/auth'

export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey } = getQuery(event)
  const authFetch = useKcFetch(event)

  const url = `${config.planningEngineUrl}/planning_board/delete`

  const unplan = await authFetch(url, {
    query: { planKey },
    method: 'put',
  })
  return unplan
})
