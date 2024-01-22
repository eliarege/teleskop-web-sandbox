import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { MachineDataRaw } from '../shared/types'

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
  const machine = ref([] as MachineDataRaw[])

  async function getMachineData() {
    const response: MachineDataRaw[] = await $fetch('/api/machines', {
      method: 'GET',
    })
    machine.value = response
  }
  getMachineData()
  // colors
  const hex = useStorage('card-color', '#4B5563')

  // settings
  const settings = ref()
  async function settingsFetch() {
    const response = await $fetch('/api/settings')
    settings.value = response
  }
  settingsFetch()
  const interval = setInterval(() => {
    settingsFetch()
    getMachineData()
  }, 5000)

  return {
    locale,
    hex,
    filteredMachines,
    filteredGroups,
    settings,
    group,
    sortMachines,
    mode,
    machine,
    electricity,
    interval,
    steam,
    salt,
    water,
  }
})
