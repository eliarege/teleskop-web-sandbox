export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/columns/unplanned_columns`
  return await authFetch(url, {
    method: 'PUT',
    body,
  })
})
