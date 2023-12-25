export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { jobOrder } = getQuery(event)
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/batch_notes/add_note`
  const addBatchNote = await $fetch(url, {
    query: { jobOrder },
    body,
    method: 'POST',
  })
  return addBatchNote
})
