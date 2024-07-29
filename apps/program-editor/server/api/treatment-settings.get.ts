import { fetchTreatmentSettings } from '../functions'

export default defineEventHandler(async () => {
  return await fetchTreatmentSettings()
})
