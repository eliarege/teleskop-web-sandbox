import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useStateStore = defineStore('state', {
  state: () => {
    const locale = useStorage('language', useI18n().locale)
    const defaultMachine = useStorage('defaultMachine', 3)
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
      locale,
      defaultMachine,
      jobOrderPrefs,
    }
  },
})
