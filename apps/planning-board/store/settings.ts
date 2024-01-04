import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useSettingStore = defineStore('settings', () => {
  const settings = useStorage('pt-settings', {
    completedBatch: {
      batchText: '',
      isBatchFabricColor: false,
      actualBatchFabricColor: '',
      deviationBatchFabricColor: '',
    },
    ongoingBatch: {
      batchText: '',
      isBatchFabricColor: false,
      actualBatchFabricColor: '',
      deviationBatchFabricColor: '',
    },
    plannedBatch: {
      batchText: '',
      isBatchFabricColor: false,
      actualBatchFabricColor: '',
      deviationBatchFabricColor: '',
    },
    batchText: [
      { id: 1, label: '', value: 'jobOrder' },
      { id: 2, label: '', value: 'planKey' },
      { id: 3, label: '', value: 'customerName' },
    ],
    archiveDays: 0,
    showStops: { show: false, color: '' },
  })
  return { settings }
})
