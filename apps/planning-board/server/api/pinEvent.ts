export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/pin_event`
  const pin = $fetch(url, {
    query: { planKey },
    method: 'PUT',
  })
  return pin
})
