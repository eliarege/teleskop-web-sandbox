export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { jobOrder } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/batch_notes`

  return await $fetch<{ userName: string, jobOrder: string, note: string, noteDate: Date | string, showOnScreen: boolean }[]>(url, {
    query: { jobOrder },
  })
})
