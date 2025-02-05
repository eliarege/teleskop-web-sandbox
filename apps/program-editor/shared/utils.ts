import { convertElementToCanvas } from '@teleskop/nuxt-base/utils/html2canvas'
import type { CreateError, MachineCommand, Program, StepError } from './types'
import { ParameterType } from './constants'

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

export function validateProgram(program: Program, machineCommands: MachineCommand[]): StepError[] {
  const errors: StepError[] = []

  const getMachineCommand = (commandNo: number): MachineCommand | undefined =>
    machineCommands.find(cmd => cmd.commandNo === commandNo)

  program.steps.forEach((step) => {
    const allCommands = [step.mainCommand, ...step.parallelCommands]

    allCommands.forEach((command) => {
      const machineCommand = getMachineCommand(command.commandNo)

      if (!machineCommand) {
        errors.push({ stepId: step.stepId, commands: [{
          commandId: command.commandId,
          messages: [{
            type: 'program-command',
            message: `${command.commandNo} numaralı komut bulunamadı.`,
          }],
        }] })
        return
      }

      const { parameters: machineParams, ioList: machineIOs } = machineCommand

      command.parameters.forEach((param) => {
        const machineParam = machineParams.find(p => p.index === param.index)

        if (!machineParam || (!machineParam.editable && machineParam.type !== ParameterType.SELECTABLE_FORMULA)) {
          errors.push({
            stepId: step.stepId,
            commands: [
              {
                commandId: command.commandId,
                messages: [
                  {
                    type: 'program-parameter',
                    message: `Parametre tanımı bulunamadı. Parametre index: ${param.index}`,
                    parameterIndex: param.index,
                  },
                ],
              },
            ],
          })

          command.parameters = command.parameters.filter(p => p.index !== param.index)
        }
      })

      machineParams.forEach((machineParam) => {
        const programParam = command.parameters.find(p => p.index === machineParam.index)

        if (!programParam) {
          if (machineParam.editable || machineParam.type === ParameterType.SELECTABLE_FORMULA) {
            errors.push({
              stepId: step.stepId,
              commands: [
                {
                  commandId: command.commandId,
                  messages: [
                    {
                      type: 'machine-parameter',
                      message: `${machineParam.name} parametresi eklendi.`,
                      parameterIndex: machineParam.index,
                    },
                  ],
                },
              ],
            })
            command.parameters.push({ index: machineParam.index, value: machineParam.value, optimized: false })
          }
        }
      })

      command.ioList.forEach((io) => {
        const machineIO = machineIOs.find(m => m.index === io.ioIndex && m.physicalId === io.ioId)
        if (!machineIO) {
          errors.push({
            stepId: step.stepId,
            commands: [
              {
                commandId: command.commandId,
                messages: [
                  {
                    type: 'program-io',
                    message: `IO tanımı bulunamadı. IO index: ${io.ioIndex}`,
                    ioIndex: io.ioIndex,
                  },
                ],
              },
            ],
          })
          command.ioList = command.ioList.filter(i => i.ioIndex !== io.ioIndex && i.ioId !== io.ioId)
        }
      })

      machineIOs.forEach((machineIO) => {
        if (!machineIO.selectable)
          return

        const programIO = command.ioList.find(io => io.ioIndex === machineIO.index && io.ioId === machineIO.physicalId)

        if (!programIO) {
          errors.push({
            stepId: step.stepId,
            commands: [
              {
                commandId: command.commandId,
                messages: [
                  {
                    type: 'program-io',
                    message: `${machineIO.name} IO'su eklendi.`,
                    ioIndex: machineIO.index,
                  },
                ],
              },
            ],
          })

          command.ioList.push({
            ioIndex: machineIO.index,
            ioId: machineIO.physicalId,
            value: machineIO.selections.map(s => [s.type, s.physicalId]),
          })
        } else if (programIO.ioIndex !== machineIO.index || programIO.ioId !== machineIO.physicalId) {
          errors.push({
            stepId: step.stepId,
            commands: [
              {
                commandId: command.commandId,
                messages: [
                  {
                    type: 'machine-io',
                    message: `IO bulunamadı. IO index: ${machineIO.index}`,
                    ioIndex: machineIO.index,
                  },
                ],
              },
            ],
          })
        }
      })
    })
  })

  const groupedErrors: Map<number, Map<number, { type: string, message: string, parameterIndex?: number }[]>> = new Map()

  errors.forEach(({ stepId, commands }) => {
    if (!groupedErrors.has(stepId)) {
      groupedErrors.set(stepId, new Map())
    }
    const stepCommands = groupedErrors.get(stepId)!

    commands.forEach(({ commandId, messages }) => {
      if (!stepCommands.has(commandId)) {
        stepCommands.set(commandId, [])
      }
      stepCommands.get(commandId)!.push(...messages)
    })
  })

  return Array.from(groupedErrors.entries()).map(([stepId, commandsMap]) => ({
    stepId,
    commands: Array.from(commandsMap.entries()).map(([commandId, messages]) => ({
      commandId,
      messages,
    })),
  }))
}
