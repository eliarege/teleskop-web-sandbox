import { fetchProcessTypes } from '../functions'

export default defineEventHandler(async () => {
  return await fetchProcessTypes()
})
