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
    batchText: [
      { id: 1, label: t('pinia.job-order'), value: 'jobOrder' },
      { id: 2, label: t('pinia.plan-key'), value: 'planKey' },
      { id: 3, label: t('pinia.customer-name'), value: 'customerName' },
    ],
    archiveDays: 0,
    showStops: { show: false, color: '' },
  })
  return { settings }
})
