export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/columns/unplanned_columns`
  return await $fetch(url, {
    method: 'PUT',
    body,
  })
})
