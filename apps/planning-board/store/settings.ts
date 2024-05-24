import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import type { MachineStatus } from '~/shared/types'

export const useSettingStore = defineStore('settings', () => {
  // const machine = useStorage('machine-settings', [] as MachineStatus[])
  const machine = ref([] as MachineStatus[])
  async function getMachines() {
    const res: MachineStatus[] = await $fetch('/api/machineList')
    machine.value = res
  }

  getMachines()
  const interval = setInterval(() => {
    getMachines()
  }, 60_000)
  const settings = useStorage('pt-settings', {
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
  return { machines: machine, settings, interval }
})
