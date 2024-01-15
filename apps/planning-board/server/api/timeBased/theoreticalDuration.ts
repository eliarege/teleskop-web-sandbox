export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey } = getQuery(event)

  const url = `${config.planningEngineUrl}/time_based/theoretical_duration`

  const theoreticalDuration = $fetch(url, {
    query: { planKey },
  })
  return theoreticalDuration
})
