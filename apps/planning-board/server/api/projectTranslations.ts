export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const authFetch = useKcFetch(event)
  const { locale } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/project-translations`
  const translations = await authFetch(url, {
    query: { locale },
    method: 'GET',
  })
  return translations
})
