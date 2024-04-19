import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { MachineDataRaw } from '../shared/types'

interface Settings {
  washing: boolean
}

export const useDataStore = defineStore('datas', () => {
  // settings
  const mode = useStorage('layout', true)
  const electricity = useStorage('electricity', true)
  const steam = useStorage('steam', true)
  const salt = useStorage('salt', true)
  const water = useStorage('water', true)
  const group = useStorage('group', false)
  const locale = useStorage('language', useI18n().locale)
  const filteredMachines = useStorage('filtered-machines', new Set<number>())
  const filteredGroups = useStorage('filtered-groups', new Set<string>())
  // machinestatus
  const sortMachines = useStorage('machine-sort', 1)

  const scrollSpeed = ref(3)
  const scrollSpeedOptions = [
    { speed: 1, frame: 4, delay: 2000 },
    { speed: 1, frame: 2, delay: 1500 },
    { speed: 1, frame: 1, delay: 1200 },
    { speed: 2, frame: 1, delay: 1000 },
    { speed: 4, frame: 1, delay: 800 },
  ]
  const scrollSpeedProps = computed(() => {
    const value = Math.round(Math.min(Math.max(scrollSpeed.value, 1), 5))
    return scrollSpeedOptions[value - 1]
  })

  type FetchStatus = 'idle' | 'pending' | 'error' | 'success'

  const machines = ref<MachineDataRaw[]>([])
  const fetchMachineStatus = ref<FetchStatus>('idle')
  const fetchMachineError = ref<Error | null>(null)
  async function fetchMachineData() {
    fetchMachineStatus.value = 'pending'
    try {
      machines.value = await $fetch('/api/machines')
      fetchMachineStatus.value = 'success'
      fetchMachineError.value = null
    } catch (err: any) {
      fetchMachineStatus.value = 'error'
      fetchMachineError.value = err
    }
  }

  // colors
  const hex = useStorage('card-color', '#4B5563')

  // settings
  const settings = ref<Settings>()
  async function fetchSettings() {
    const response = await $fetch('/api/settings')
    settings.value = response
  }

  fetchSettings()
  fetchMachineData()

  return {
    locale,
    hex,
    filteredMachines,
    filteredGroups,
    settings,
    group,
    sortMachines,
    mode,
    machines,
    electricity,
    steam,
    salt,
    water,
    scrollSpeed,
    scrollSpeedProps,
    fetchMachineStatus,
    fetchMachineError,
    fetchSettings,
    fetchMachineData,
  }
})
