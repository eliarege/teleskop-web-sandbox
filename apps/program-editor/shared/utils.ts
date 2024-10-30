import html2canvas from 'html2canvas-pro'

export const as = <T>(value: T) => value as T

export const isDef = <T = any>(val?: T): val is T => typeof val !== 'undefined'

export function capitalize<T extends string>(string: T): Capitalize<T> {
  return string[0].toUpperCase() + string.slice(1) as Capitalize<T>
}

export function groupBy<T>(collection: T[], callback: (item: T) => string | number): Record<string | number, T[]> {
  return collection.reduce((groups, item) => {
    const key = callback(item)
    groups[key] = groups[key] || []
    groups[key].push(item)
    return groups
  }, {} as Record<string | number, T[]>)
}

export function groupByMap<K, V>(collection: V[], callback: (item: V) => K): Map<K, V[]> {
  return collection.reduce((groups, item) => {
    const key = callback(item)
    if (groups.has(key)) {
      groups.get(key)!.push(item)
    } else {
      groups.set(key, [item])
    }
    return groups
  }, new Map<K, V[]>())
}

export function isUint(value: number): boolean {
  return !Number.isNaN(value) && value >= 0 && (value % 1 === 0)
}

export function measure<Fn extends (...args: any[]) => any>(cb: Fn): Fn {
  return ((...args: any[]): any => {
    const start = new Date().getTime()
    cb(...args)
    const end = new Date().getTime()
    console.log(`${cb.name} took ${end - start}ms`)
  }) as Fn
}

export function getCaller() {
  return new Error('...').stack?.split('\n')[3]
}

export async function screenShot(element: HTMLElement, filename: string) {
  if (element) {
    const canvas = await html2canvas(element, {
      logging: false,
      useCORS: true,
      scale: window.devicePixelRatio,
      onclone(document) {
        const recurse = (el: Element, cb: (el: Element) => void) => {
          cb(el)
          for (const child of el.children) {
            recurse(child, cb)
          }
        }

        const stringToUInt8Array = (str: string) => {
          const arr = new Uint8Array(str.length)
          for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i)
          }
          return arr
        }

        const UTF8_RE = /^utf-?8$/i
        /** 1st capturing group should return encoding of data if its present, 2nd capturing group returns data. */
        const SVG_DATA_URL_RE = /^url\(['"]?data:image\/svg\+xml(?:;[\w-]+=[\w-]+?)*(?:;([\w-]+))?,(.+?)['"]?\)$/i

        recurse(document.body, (el) => {
          const styles = getComputedStyle(el)
          const svgUrlMatch = styles.maskImage.match(SVG_DATA_URL_RE)

          if (!svgUrlMatch)
            return

          const color = styles.backgroundColor
          let [encoding = 'utf8', data] = svgUrlMatch.slice(1)

          if (UTF8_RE.test(encoding)) {
            const decoder = new TextDecoder(encoding)
            data = decoder.decode(stringToUInt8Array(data))
          }

          const cloneEl = el.cloneNode()
          if (!(cloneEl instanceof HTMLElement))
            return

          cloneEl.style.backgroundColor = 'transparent'
          cloneEl.innerHTML = decodeURIComponent(data)

          const svgEl = cloneEl.firstChild as SVGSVGElement
          svgEl.style.color = color
          svgEl.style.width = '100%'
          svgEl.style.height = '100%'

          el.parentNode?.replaceChild(cloneEl, el)
        })
      },
    })
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
}
