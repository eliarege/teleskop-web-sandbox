import type { SchedulerEventModel } from '@bryntum/schedulerpro'
import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import type { PtLocaleSettings } from '~/shared/types'

export const useSettingStore = defineStore('settings', () => {
  const startDate = ref()
  const endDate = ref()
  const schedulerDateModel = ref({
    from: startDate.value,
    to: endDate.value,
  })
  const unplannedText = ref()
  const machineOrdering = useStorage<number[]>('pt-machineOrdering', [])

  const selectedEvent = ref({} as SchedulerEventModel)

  const settings = useStorage('pt-settings', {
    deviationColor: '',
    completedBatchColor: '#007efc',
    completedBatchText: ['jobOrder'],
    completedBatchFabricColor: false,
    ongoingBatchColor: '#c0d61a',
    ongoingBatchText: ['jobOrder'],
    ongoingBatchFabricColor: false,
    plannedBatchColor: '',
    plannedBatchText: ['jobOrder'],
    plannedBatchFabricColor: false,
    showStops: { show: false, color: '#d61515' },
  } as PtLocaleSettings)

  return {
    startDate,
    endDate,
    unplannedText,
    schedulerDateModel,
    settings,
    selectedEvent,
    machineOrdering,
  }
})
