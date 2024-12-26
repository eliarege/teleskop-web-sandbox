import { LRUCache } from 'lru-cache'
import type { ArchivedIoValues } from '~/types/archive'
import type { DuoRaw } from '~/types/utils'

const { teleskopArchiveServerUrl } = useRuntimeConfig()

export const archiveCache = new LRUCache<number, DuoRaw<ArchivedIoValues & { startTime: string }>>({
  max: 100,
  async fetchMethod(key, _, { signal }) {
    return await $fetch(`${teleskopArchiveServerUrl}/?${key}`, { signal })
  },
})
