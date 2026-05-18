import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useStateStore = defineStore('state', {
  state: () => {
    const defaultMachine = useStorage('defaultMachine', 1)
    const jobOrderPrefs = useStorage('jobOrderPrefs', {
      allowOverrideStartedJobOrders: true,
      show: {
        ASNo: false,
        yarn: false,
        orderNo: false,
      },
    }, undefined, { mergeDefaults: true })
    return {
      isLoading: false,
      jobOrderFilters: [],
      defaultMachine,
      jobOrderPrefs,
    }
  },
})
