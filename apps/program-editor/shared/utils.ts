import { convertElementToCanvas } from '@teleskop/nuxt-base/utils/html2canvas'
import type { MachineCommand, Program } from './types'

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

export async function screenshot(element: HTMLElement, filename: string) {
  const canvas = await convertElementToCanvas(element)
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
export function checkProgram(program: Program, machineCommands: MachineCommand[]): { stepId: number, commandId: number, message: string }[] {
  const errors: { stepId: number, commandId: number, message: string }[] = []

  const getMachineCommand = (commandNo: number): MachineCommand | undefined =>
    machineCommands.find(cmd => cmd.commandNo === commandNo)

  const generateErrorMessage = (stepId: number, commandId: number, message: string) => {
    errors.push({ stepId, commandId, message })
  }

  program.steps.forEach((step) => {
    const allCommands = [step.mainCommand, ...step.parallelCommands]

    allCommands.forEach((command) => {
      const machineCommand = getMachineCommand(command.commandNo)

      if (!command.commandNo) {
        generateErrorMessage(step.stepId, command.commandId, 'Komut numarası yok.')
        return
      }

      if (!machineCommand) {
        generateErrorMessage(step.stepId, command.commandId, `Komut bulunamıyor. Komut numarası: ${command.commandNo}`)
        return
      }

      const { parameters: machineParams, ioList: machineIOs } = machineCommand

      machineParams.forEach((machineParam) => {
        const programParam = command.parameters.find(p => p.index === machineParam.index)

        if (!programParam) {
          generateErrorMessage(step.stepId, command.commandId, `Parametre yok. Parametre index: ${machineParam.index}`)
        } else {
          if (
            typeof programParam.value === 'number'
            && (programParam.value < machineParam.minValue || programParam.value > machineParam.maxValue)
          ) {
            generateErrorMessage(step.stepId, command.commandId, `Parametre aralık dışında. Parametre index: ${machineParam.index}`)
          }
        }
      })

      machineIOs.forEach((machineIO) => {
        const programIO = command.ioList.find(io => io.ioIndex === machineIO.index)

        if (!programIO) {
          generateErrorMessage(step.stepId, command.commandId, `IO yok. IO index: ${machineIO.index}`)
        } else {
          if (programIO.ioIndex !== machineIO.index && programIO.ioId !== machineIO.physicalId) {
            generateErrorMessage(step.stepId, command.commandId, `IO bulunamadı. IO index: ${machineIO.index}`)
          }
        }
      })
    })
  })

  return errors
}
