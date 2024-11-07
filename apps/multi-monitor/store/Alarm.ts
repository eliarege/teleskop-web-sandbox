import { defineStore } from 'pinia'
import type { FetchStatus, MachineAlarmList } from '~/shared/types'

export const useAlarmStore = defineStore('alarm', () => {
  const alarmList = ref([] as MachineAlarmList[])

  const fetchAlarmStatus = ref<FetchStatus>('idle')
  const fetchAlarmError = ref<Error | null>(null)

  async function fetchAlarmList() {
    fetchAlarmStatus.value = 'pending'

    try {
      alarmList.value = await $fetch('/api/alarmList')
      fetchAlarmStatus.value = 'success'
    } catch (err: any) {
      fetchAlarmStatus.value = 'error'
      fetchAlarmError.value = err
    }
  }
  fetchAlarmList()
  return {
    alarmList,
    fetchAlarmList,
  }
})
