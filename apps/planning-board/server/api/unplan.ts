export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/unplan`

  const unplan = await $fetch(url, {
    query: { planKey },
    method: 'put',
  })
  return unplan
})
