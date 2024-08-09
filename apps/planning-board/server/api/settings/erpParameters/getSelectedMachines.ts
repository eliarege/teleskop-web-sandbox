export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { paramString } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/settings/erp_parameters`
  if (paramString) {
    return await $fetch<number[]>(url, {
      query: { paramString },
    })
  } else throw createError({ statusCode: 400, statusMessage: 'MISSING QUERY' })
})
