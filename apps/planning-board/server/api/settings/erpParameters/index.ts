export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { distinct } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/settings/erp_parameters`
  if (distinct) {
    return await authFetch<{ paramName: string, paramId: number }[]>(url, {
      query: { distinct },
    })
  } else throw createError({ statusCode: 400, statusMessage: 'MISSING QUERY' })
})
