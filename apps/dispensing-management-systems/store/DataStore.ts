import { defineStore } from 'pinia'
import type { Dispenser } from '~/shared/types'

export const useDataStore = defineStore('data', () => {
  const title = ref('')
  const selectedDispenser = ref<Dispenser>()
  const dispensers = ref<Dispenser[]>()
  return {
    title,
    selectedDispenser,
    dispensers,
  }
})
