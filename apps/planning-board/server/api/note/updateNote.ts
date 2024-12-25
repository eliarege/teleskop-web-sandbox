export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/batch_notes/update_note`
  const addBatchNote = await authFetch(url, {
    body,
    method: 'PUT',
  })
  return addBatchNote
})
