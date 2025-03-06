import { klona } from 'klona/json'

export interface AppMeta {
  name: string
  url: string
  img: string
}

// TODO: Applications should be fetched from an external meta service
export const useAppList = memoize<AppMeta[]>(() => {
  const config = useRuntimeConfig()
  const { appList } = config.public

  if (typeof appList === 'string') {
    try {
      return JSON.parse(appList || '[]') as any[]
    } catch (error) {
      console.warn(`Failed to parse APP_LIST`, error)
      return []
    }
  } else if (Array.isArray(appList)) {
    return appList
  } else {
    if (appList)
      console.warn(`Unexpected APP_LIST value`, appList)
    return []
  }
})

function memoize<T>(cb: () => T): () => T {
  let memoized = false
  let value: T
  return () => {
    if (!memoized) {
      value = cb()
      memoized = true
    }
    return klona(value)
  }
}
