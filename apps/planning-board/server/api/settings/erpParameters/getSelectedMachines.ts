export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { paramString } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/settings/erp_parameters`
  if (paramString) {
    return await authFetch<number[]>(url, {
      query: { paramString },
    })
  } else throw createError({ statusCode: 400, statusMessage: 'MISSING QUERY' })
})
