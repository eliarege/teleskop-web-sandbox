import { getTrendData } from '../queries/trendData'

export default defineEventHandler(async (_event) => {
  return getTrendData()
})
