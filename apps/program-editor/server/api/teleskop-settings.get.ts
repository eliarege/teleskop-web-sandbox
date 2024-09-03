import { fetchTeleskopSettings } from '../functions'

export default defineAuthEventHandler(async () => {
  return await fetchTeleskopSettings()
})
