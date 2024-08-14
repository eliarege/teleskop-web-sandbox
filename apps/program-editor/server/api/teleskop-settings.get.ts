import { fetchTeleskopSettings } from '../functions'

export default defineAuthEventHandler(async (event) => {
  if (event.method === 'GET') {
    const query = getQuery(event)
    const id = Number(query.id)

    return await fetchTeleskopSettings(id)
  }
})
