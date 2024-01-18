export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { archiveDays } = getQuery(event)

  const url = `${config.planningEngineUrl}/queue_based/archive_events`

  const archive = $fetch(url, {
    query: { archiveDays },
  })
  return archive
})
