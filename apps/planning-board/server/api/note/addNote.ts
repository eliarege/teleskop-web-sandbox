export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { jobOrder } = getQuery(event)
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/batch_notes/add_note`
  const addBatchNote = await authFetch(url, {
    query: { jobOrder },
    body,
    method: 'POST',
  })
  return addBatchNote
})
