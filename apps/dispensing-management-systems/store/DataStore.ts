import { defineStore } from 'pinia'
import type { Dispenser, DispenserType } from '~/shared/types'

export const useDataStore = defineStore('data', () => {
  const title = ref('')
  const selectedDispenser = ref<Dispenser>()
  const dispensers = ref<Dispenser[]>()
  const dispenserTypes = ref<DispenserType[]>()
  const getDispensers = async () => {
    if (dispensers.value)
      return dispensers.value
    const fetchedDispensers = await $fetch<Dispenser[]>(`/api/dispensers`)
    dispensers.value = fetchedDispensers
    return fetchedDispensers
  }
  async function getDispenserTypes() {
    if (dispenserTypes.value) {
      return dispenserTypes.value
    }
    const fetchedTypes = await $fetch<DispenserType[]>(`/api/dispensers/types`)
    dispenserTypes.value = fetchedTypes
    return fetchedTypes
  }
  return {
    title,
    selectedDispenser,
    dispensers,
    dispenserTypes,
    getDispensers,
    getDispenserTypes,
  }
})
