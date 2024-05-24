import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import type { PtLocaleSettings } from '~/shared/types'

export const useSettingStore = defineStore('settings', () => {
  const machineOrdering = useStorage<number[]>('pt-machineOrdering', [])

  const settings = useStorage<PtLocaleSettings>('pt-settings', {
    completedBatch: {
      batchText: null,
      isBatchFabricColor: false,
      actualBatchFabricColor: '',
      deviationBatchFabricColor: '',
    },
    ongoingBatch: {
      batchText: null,
      isBatchFabricColor: false,
      actualBatchFabricColor: '',
      deviationBatchFabricColor: '',
    },
    plannedBatch: {
      batchText: null,
      isBatchFabricColor: false,
      actualBatchFabricColor: '',
      deviationBatchFabricColor: '',
    },
    archiveDays: 0,
    showStops: { show: false, color: '' },
    batchText: [],
  })

  return {
    settings,
    machineOrdering,
  }
})
