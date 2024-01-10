import { defineStore } from 'pinia'
import { StorageSerializers, useStorage } from '@vueuse/core'
import type { Dispenser, User } from '~/shared/types'

export const useDataStore = defineStore('data', () => {
  const user = useStorage<User>('user', null, undefined, { serializer: StorageSerializers.object })
  const title = ref('')
  const selectedDispenser = ref<Dispenser>()
  const dispensers = ref<Dispenser[]>()
  return {
    user,
    title,
    selectedDispenser,
    dispensers,
  }
})
