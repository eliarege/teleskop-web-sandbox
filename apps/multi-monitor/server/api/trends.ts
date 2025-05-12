import { getTrendData } from '../queries'

export default defineEventHandler(async (_event) => {
  return getTrendData()
})
