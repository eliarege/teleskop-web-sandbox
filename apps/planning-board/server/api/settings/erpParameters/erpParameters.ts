export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { machineId, distinct } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/settings/erp_parameters`
  if (distinct) {
    return await $fetch<{ paramName: string }[]>(url, {
      query: { distinct },
    })
  } else if (machineId) {
    return await $fetch<{ definitions: any[], plannedDefinitions: any[], unplannedDefinitions: any[] }>(url, {
      query: { machineId },
    })
  } else throw createError({ statusCode: 400, statusMessage: 'MISSING QUERY' })
})
