import { fetchTeleskopSettings } from '../functions'

export default defineAuthEventHandler(async (event) => {
  return await fetchTeleskopSettings()
})
