export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { id } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/batch_notes/note`
  const deleteBatchNote = await $fetch(url, {
    query: { id },
    method: 'delete',
  })
  return deleteBatchNote
})
