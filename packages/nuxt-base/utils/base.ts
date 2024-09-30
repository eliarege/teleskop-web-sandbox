// TODO: Applications should be fetched from an external meta service
export function parseAppList(appList: unknown): { name: string, url: string, img: string }[] {
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
}

export function sleep(duration = 300) {
  return new Promise((r) => {
    setTimeout(r, duration)
  })
}
