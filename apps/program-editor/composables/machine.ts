import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'

export const useMachineStatusStore = defineStore('machine-status', () => {
  const offlineMachines = ref<Set<number>>(new Set())

  function setOffline(machineId: number) {
    offlineMachines.value.add(machineId)
  }

  function setOnline(machineId: number) {
    offlineMachines.value.delete(machineId)
  }

  function isOffline(machineId: number): boolean {
    return offlineMachines.value.has(machineId)
  }

  async function checkMachineStatus(machineId: number): Promise<boolean> {
    const { fetch } = useKeycloak()

    try {
      const status = await fetch<boolean>(`/api/machine/${machineId}/status`)

      if (status) {
        setOnline(machineId)
      } else {
        setOffline(machineId)
      }

      return status
    } catch (error) {
      setOffline(machineId)
      return false
    }
  }

  return {
    offlineMachines,
    setOffline,
    setOnline,
    isOffline,
    checkMachineStatus,
  }
})
