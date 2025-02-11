import { format } from 'date-fns'
import { AUTHOR, BEGIN_HEADER, BEGIN_PROGRAM, COMMENT, CREATED_AT_DATE, CREATED_AT_TIME, END_TAGS, FIRST_COMMAND_NO, LAST_COMMAND_NO, NAME, PROCESS_CODE, START_TAGS, UPDATED_AT_DATE, UPDATED_AT_TIME } from './constants'
import type { Machine, Program } from '~/shared/types'
import { ParameterType } from '~/shared/constants'

export function stringifyProgram(program: Program, machine: Pick<Machine, 'commands'>): string {
  const lines: string[] = []

  const dateFormat = 'dd.MM.yy'
  const timeFormat = 'HH:mm:ss'

  const createdAtDate = program.createdAt ? format(program.createdAt, dateFormat) : ''
  const createdAtTime = program.createdAt ? format(program.createdAt, timeFormat) : ''
  const updatedAtDate = program.updatedAt ? format(program.updatedAt, dateFormat) : ''
  const updatedAtTime = program.updatedAt ? format(program.updatedAt, timeFormat) : ''

  let stepCount = 0
  lines.push(
    BEGIN_HEADER,
    `${NAME}=${program.name}`,
    `${CREATED_AT_DATE}=${createdAtDate}`,
    `${CREATED_AT_TIME}=${createdAtTime}`,
    `${UPDATED_AT_DATE}=${updatedAtDate}`,
    `${UPDATED_AT_TIME}=${updatedAtTime}`,
    `${AUTHOR}=${program.author || ''}`,
    `${COMMENT}=${program.comment || ''}`,
    `${PROCESS_CODE}=${program.typeId}`,
    BEGIN_PROGRAM,
    FIRST_COMMAND_NO,
    ...program.steps.flatMap((step) => {
      const command = machine.commands.get(step.mainCommand.commandNo!)
      const mainCommand = [
        step.mainCommand.commandNo,
        'F=1',
        `P=${stepCount}`,
        `IO=${command?.ioList
          .map((io) => {
            if (io.selectable) {
              const ioItem = step.mainCommand.ioList.find(pio => pio.ioIndex === io.index)
              if (!ioItem) {
                return ''
              }
              return `[${ioItem.value.map(v => `(${v[0]},${v[1]})`).join('')}]`
            } else {
              return `[(${io.type + 1},${io.physicalId})]`
            }
          })
          .join('') || ''}`,
        `SP=${step?.mainCommand?.parameters?.map((parameter) => {
          const parameterType = command?.parameters.find(p => p.index === parameter.index)?.type || ParameterType.NUMBER
          return parameterType === ParameterType.SELECTABLE_FORMULA || parameterType === ParameterType.MACHINE_FORMULA
            ? parameter.value
            : Number.parseFloat(String(parameter.value)).toFixed(2)
        }).join(' ')
        }`,
      ].join(' ')

      const parallelCommands = step.parallelCommands.map((parallelCmd) => {
        const command = machine.commands.get(parallelCmd.commandNo!)
        const parts = [
          parallelCmd.commandNo,
          'F=1',
          `P=${stepCount}`,
          `IO=${command!.ioList
            .map((io) => {
              if (io.selectable) {
                const ioItem = parallelCmd.ioList.find(pio => pio.ioIndex === io.index)
                if (!ioItem) {
                  return ''
                }
                return `[${ioItem.value.map(v => `(${v[0]},${v[1]})`).join('')}]`
              } else {
                return `[(${io.type + 1},${io.physicalId})]`
              }
            })
            .join('') || ''}`,
          `SP=${parallelCmd.parameters.map((parameter) => {
            const parameterType = command?.parameters.find(p => p.index === parameter.index)?.type || ParameterType.NUMBER
            return parameterType === ParameterType.SELECTABLE_FORMULA || parameterType === ParameterType.MACHINE_FORMULA
              ? parameter.value
              : Number.parseFloat(String(parameter.value)).toFixed(2)
          }).join(' ')}`,
        ].join(' ')
        return parts
      })
      stepCount++
      return [mainCommand, ...parallelCommands]
    }),
    LAST_COMMAND_NO,
    START_TAGS,
    'INTERVENTIONFREEPROGRAM=0', // ?
    END_TAGS,
  )

  return lines.join('\n')
}
