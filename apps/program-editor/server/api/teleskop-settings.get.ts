import { fetchTeleskopSettings } from '../functions'

export default defineAuthEventHandler(async (event) => {
  if (event.method === 'GET') {
    return await fetchTeleskopSettings()
  }
})
