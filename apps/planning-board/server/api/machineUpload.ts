import { TbbFtpClient } from 'tbb-ftp-client'
import { stringifyProgram } from '~/composables/helper'
import type { Program } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { program, machineId, planKey, machineIp, jobOrder } = getQuery(event)
  const url = `${config.planningEngineUrl}/planning_board/upload_joborder`
  const upload = await $fetch(url, {
    method: 'PUT',
    query: { program, machineId, planKey, machineIp, jobOrder },
  })
  return upload
})
