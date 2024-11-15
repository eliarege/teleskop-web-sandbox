import { defineStore } from 'pinia'
import type { FetchStatus, MachineAlarmList, MachineAlarmStats } from '~/shared/types'

export const useAlarmStore = defineStore('alarm', () => {
  const alarmList = ref([] as MachineAlarmList[])
  const alarmStats = ref({} as MachineAlarmStats)

  const fetchAlarmStatus = ref<FetchStatus>('idle')
  const fetchAlarmError = ref<Error | null>(null)

  async function fetchAlarmList() {
    fetchAlarmStatus.value = 'pending'

    try {
      alarmList.value = await $fetch('/api/alarmList')
      alarmStats.value = await $fetch('/api/alarmStatistics')

      fetchAlarmStatus.value = 'success'
    } catch (err: any) {
      fetchAlarmStatus.value = 'error'
      fetchAlarmError.value = err
    }
  }
  fetchAlarmList()
  return {
    alarmList,
    alarmStats,
    fetchAlarmList,
  }
})
