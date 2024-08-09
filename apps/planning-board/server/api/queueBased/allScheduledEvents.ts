export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/queue_based/all_scheduled_events`

  const events = await $fetch<{ jobOrder: string, startTime: string }[]>(url)
  return events
})
