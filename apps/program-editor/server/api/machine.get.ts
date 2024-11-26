import { getMachines, getMachinesAsList } from '~/server/functions'

export default defineAuthEventHandler(async (event) => {
  const query = getQuery(event)
  if (query?.asList)
    return await getMachinesAsList()
  return await getMachines()
})
