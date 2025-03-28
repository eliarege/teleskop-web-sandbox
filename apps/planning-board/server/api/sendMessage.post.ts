export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const body = await readBody(event)
  const url = `${config.planningEngineUrl}/planning_board/send_message`
  const sendMessage = authFetch<string>(url, {
    method: 'POST',
    body,
  })
  return sendMessage
})
