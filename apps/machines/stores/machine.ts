import { defineStore } from 'pinia'

export const useMachineStore = defineStore('machine', () => {
  const selectedMachines = ref([])

  return selectedMachines
})
