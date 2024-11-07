import html2canvas, { type Options } from 'html2canvas-pro'

export async function convertElementToCanvas(element: HTMLElement, options?: Partial<Options>): Promise<HTMLCanvasElement> {
  const canvas = await html2canvas(element, {
    ...options,
    logging: false,
    scale: window.devicePixelRatio,
    onclone(document, element) {
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

      recurse(element, (el) => {
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

      // Call if user provided `onclone`
      options?.onclone?.(document, element)
    },
  })
  return canvas
}
