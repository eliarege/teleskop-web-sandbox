import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useStateStore = defineStore('state', {
  state: () => {
    const locale = useStorage('language', useI18n().locale)
    const defaultMachine = useStorage('defaultMachine', 3)
    const jobOrderPrefs = useStorage('jobOrderPrefs', {
      allowOverrideStartedJobOrders: true,
    })
    return {
      isLoading: false,
      jobOrderFilters: [],
      locale,
      defaultMachine,
      jobOrderPrefs,
    }
  },
})
