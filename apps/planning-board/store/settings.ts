import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import type { PtLocaleSettings } from '~/shared/types'

export const useSettingStore = defineStore('settings', () => {
  const machineOrdering = useStorage<number[]>('pt-machineOrdering', [])

  const settings = useStorage<PtLocaleSettings>('pt-settings', {
    deviationColor: '#000000',
    completedBatchColor: '#000000',
    completedBatchText: 'jobOrder',
    completedBatchFabricColor: false,
    ongoingBatchColor: '#000000',
    ongoingBatchText: 'jobOrder',
    ongoingBatchFabricColor: false,
    plannedBatchColor: '#000000',
    plannedBatchText: 'jobOrder',
    plannedBatchFabricColor: false,
    showStops: { show: false, color: '#000000' },
  })

  return {
    settings,
    machineOrdering,
  }
})
