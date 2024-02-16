import { defineStore } from 'pinia'
import type { Dispenser, DispenserType } from '~/shared/types'

export const useDataStore = defineStore('data', () => {
  const title = ref('')
  const selectedDispenser = ref<Dispenser>()
  const dispensers = ref<Dispenser[]>()
  const dispenserTypes = ref<DispenserType[]>()
  return {
    title,
    selectedDispenser,
    dispensers,
    dispenserTypes,
  }
})
