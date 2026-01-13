export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const url = `${config.planningEngineUrl}/planning_board/auto_add`
  const body = await readBody(event)
  return await authFetch<boolean>(url, {
    method: 'PUT',
    body,
  })
})
