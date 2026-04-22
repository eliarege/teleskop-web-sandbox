import { LRUCache } from 'lru-cache'
import type { ArchivedIoValues } from '~/types/archive'
import type { DuoRaw } from '~/types/utils'

const { teleskopArchiveServerUrl } = useRuntimeConfig()

export class IoValuesNotFoundError extends Error {
  constructor(batchKey: number) {
    super(`IO values not found for batch key: ${batchKey}`)
    this.name = 'IoValuesNotFoundError'
  }
}

export type ArchivedIoValuesWithStartTime = ArchivedIoValues & { startTime: string }

export const archiveCache = new LRUCache<number, DuoRaw<ArchivedIoValuesWithStartTime>>({
  max: 100,
  async fetchMethod(key, _, { signal }) {
    const data = await $fetch<DuoRaw<ArchivedIoValuesWithStartTime>>(`${teleskopArchiveServerUrl}/?${key}`, { signal })
    if (!data || !data.analogValues?.length) {
      throw new IoValuesNotFoundError(key)
    }
    return data
  },
})
