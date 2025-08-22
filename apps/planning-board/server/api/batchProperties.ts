export default defineAuthEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { planKey, machineId } = getQuery(event)
  const authFetch = useKcFetch(event)

  const url = `${config.planningEngineUrl}/planning_board/batch_properties`
  interface ErpParameter {
    paramId: number
    paramName: string
    value: string
  }

  interface Program {
    prgNo: number
    prgName: string
    theoreticalDuration: number
    actualDuration: number
    currentlyRunning: boolean
  }

  interface Time {
    theoreticalDuration: number
    startTime: Date | null
    endTime: Date | null
    plannedStartTime: Date | null
  }

  interface ApiResponse {
    erpParameters: ErpParameter[]
    programs: Program[]
    times: Time
  }
  const batchProperties = await authFetch<ApiResponse>(url, {
    query: { planKey, machineId },
  })
  return batchProperties
})
