import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { Unit } from '~/shared/enums'

export const useStateStore = defineStore('state', {
  state: () => {
    const defaultMachine = useStorage('defaultMachine', 1)
    const partCountActive = useStorage('partCountActive', false)
    const defaultUnitTypeDye = useStorage('defaultUnitTypeDye', Unit.Percent)
    const defaultUnitTypeChem = useStorage('defaultUnitTypeChem', Unit.GramPerLiter)
    const partCountColumn = useStorage<string | null>('partCountColumn', null)
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
      partCountActive,
      defaultUnitTypeDye,
      defaultUnitTypeChem,
      partCountColumn,
      jobOrderPrefs,
    }
  },
})
