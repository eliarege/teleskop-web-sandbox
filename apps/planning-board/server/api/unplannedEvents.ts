import { decompressJson } from '~/composables/helper'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/unscheduled_events`

  const unplannedEvents = await $fetch<string>(url)
  return unplannedEvents
})
