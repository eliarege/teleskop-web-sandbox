export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey, fabricWeight } = getQuery(event)

  const url = `${config.planningEngineUrl}/planning_board/valid`

  const isValid = $fetch(url, {
    query: { planKey, fabricWeight },
  })
  return isValid
})
