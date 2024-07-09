import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import type { PtLocaleSettings } from '~/shared/types'

export const useSettingStore = defineStore('settings', () => {
  const machineOrdering = useStorage<number[]>('pt-machineOrdering', [])

  const settings = useStorage('pt-settings', {
    deviationColor: '',
    completedBatchColor: '',
    completedBatchText: 'jobOrder',
    completedBatchFabricColor: false,
    ongoingBatchColor: '',
    ongoingBatchText: 'jobOrder',
    ongoingBatchFabricColor: false,
    plannedBatchColor: '',
    plannedBatchText: 'jobOrder',
    plannedBatchFabricColor: false,
    showStops: { show: false, color: '' },
  } as PtLocaleSettings)

  return {
    settings,
    machineOrdering,
  }
})
