export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { id } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/batch_notes/note`
  const deleteBatchNote = await authFetch(url, {
    query: { id },
    method: 'delete',
  })
  return deleteBatchNote
})
