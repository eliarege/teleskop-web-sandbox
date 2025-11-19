import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'

export const useMachineStatusStore = defineStore('machine-status', () => {
  const offlineMachines = ref<Set<number>>(new Set())
  const { notifySuccess, notifyError } = useNotify()
  const { t } = useI18n()

  function setOffline(machineId: number) {
    offlineMachines.value.add(machineId)
  }

  function setOnline(machineId: number) {
    offlineMachines.value.delete(machineId)
  }

  function isOffline(machineId: number): boolean {
    return offlineMachines.value.has(machineId)
  }

  async function checkMachineStatus(
    machineId: number,
    options: {
      notifyOnSuccess?: boolean
      notifyOnError?: boolean
    } = {},
  ): Promise<boolean> {
    const { fetch } = useKeycloak()
    const { notifyOnSuccess = false, notifyOnError = true } = options

    try {
      const status = await fetch<boolean>(`/api/machine/${machineId}/status`)

      if (status) {
        setOnline(machineId)
        if (notifyOnSuccess) {
          notifySuccess(t('machine.isOnline'))
        }
      } else {
        setOffline(machineId)
        if (notifyOnError) {
          notifyError(t('machine.isOffline'))
        }
      }

      return status
    } catch (error) {
      setOffline(machineId)
      if (notifyOnError) {
        notifyError(t('machine.isOffline'))
      }
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
