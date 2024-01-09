import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useStateStore = defineStore('state', {
  state: () => {
    const locale = useStorage('language', useI18n().locale)
    return {
      isLoading: false,
      locale,
    }
  },
})
