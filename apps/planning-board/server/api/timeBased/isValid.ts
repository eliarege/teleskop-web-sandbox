export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey } = getQuery(event)

  const url = `${config.planningEngineUrl}/time_based/valid`

  const isValid = $fetch(url, {
    query: { planKey },
  })
  return isValid
})
