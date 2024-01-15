export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/queue_based/scheduled_events/update`
  const planningBoardUpdate = await $fetch(url, {
    body,
    method: 'PUT',
  })
  return planningBoardUpdate
})
