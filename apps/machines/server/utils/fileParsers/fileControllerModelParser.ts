import type { FinishReason } from '~/types'

const pattern = /^(.+)-(.+)-(.+)$/gim

/**
 * '/var/controllerModel'
 * example: T7700-Giada-TBBPLC
 */

export function fileControllerModelParser(content: string) {
  const match = pattern.exec(content)
  const controllerModel = {
    ProductModel: match[1],
    HardwareModel: match[2],
    PlcModel: match[3],
  }
  pattern.lastIndex = 0
  return controllerModel
}
