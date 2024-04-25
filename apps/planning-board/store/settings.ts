import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useSettingStore = defineStore('settings', () => {
  const { t } = useI18n()
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
    archiveDays: 0,
    showStops: { show: false, color: '' },
  })
  return { settings }
})
