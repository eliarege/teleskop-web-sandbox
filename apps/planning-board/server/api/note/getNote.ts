export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { jobOrder } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/batch_notes`

  return await authFetch<{ userName: string, jobOrder: string, note: string, noteDate: Date | string, showOnScreen: boolean }[]>(url, {
    query: { jobOrder },
  })
})
