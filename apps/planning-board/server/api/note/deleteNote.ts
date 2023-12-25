export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { id } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/batch_notes/delete_note`
  const deleteBatchNote = await $fetch(url, {
    query: { id },
    method: 'delete',
  })
  return deleteBatchNote
})
