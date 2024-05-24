export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/batch_notes/update_note`
  const addBatchNote = await $fetch(url, {
    body,
    method: 'PUT',
  })
  return addBatchNote
})
