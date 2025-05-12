import { getOperatorInterventions } from '../queries'

export default defineEventHandler(async (event) => {
  const { interventParam: machineId } = getQuery(event)
  return getOperatorInterventions(machineId)
})
