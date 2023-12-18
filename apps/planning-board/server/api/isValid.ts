export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/valid`

  const isValid = $fetch(url, {
    query: { planKey },
  })
  return isValid
})
