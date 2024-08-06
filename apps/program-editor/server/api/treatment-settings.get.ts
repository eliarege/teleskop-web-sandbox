import { fetchTreatmentSettings } from '../functions'

export default defineAuthEventHandler(async () => {
  return await fetchTreatmentSettings()
})
