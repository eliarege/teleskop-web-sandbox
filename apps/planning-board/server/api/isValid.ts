export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/valid`

  const plannedEvents = $fetch(url, {
    query: { planKey },
  })
  return plannedEvents
})
