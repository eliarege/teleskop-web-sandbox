export function isEqual(a: any, b: any): boolean {
  if (a === b) {
    return true
  }
  const aType = typeof a
  const bType = typeof b

  if (aType !== bType)
    return false

  if (aType !== 'object') {
    return false
  } else {
    const aArray = Array.isArray(a)
    const bArray = Array.isArray(b)
    if (aArray !== bArray)
      return false

    if (aArray) {
      if (a.length !== b.length)
        return false

      a = a.slice(0)
      b = b.slice(0)

      for (let i = 0; i < a.length; i++) {
        const j = b.findIndex((bj: any) => isEqual(a[i], bj))
        if (j < 0)
          return false
        b.splice(j, 1)
      }
    } else {
      const aKeys = Object.keys(a)
      const bKeys = Object.keys(b)
      if (!isEqual(aKeys, bKeys)) {
        return false
      }

      for (const key of aKeys) {
        if (!isEqual(a[key], b[key])) {
          return false
        }
      }
    }
    return true
  }
}
