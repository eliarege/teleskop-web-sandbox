import type { Machine } from '~/types'

const pattern = /^(.+)-(.+)-(.+)$/gim

/**
 * '/var/controllerModel'
 * example: T7700-Giada-TBBPLC
 */

export function fileControllerModelParser(content: string) {
  const match = pattern.exec(content)
  if (match) {
    const controllerModel: Machine = {
      productModel: match[1],
      hardwareModel: match[2],
      plcModel: match[3],
    }
    pattern.lastIndex = 0
    return controllerModel
  }
}
