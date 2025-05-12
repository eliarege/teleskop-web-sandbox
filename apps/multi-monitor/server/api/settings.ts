import { getTeleskopSettings } from '../queries'

export default defineEventHandler(async () => {
  return await getTeleskopSettings()
})
