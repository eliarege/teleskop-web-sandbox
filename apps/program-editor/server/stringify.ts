import { format } from 'date-fns'
import { AUTHOR, BEGIN_HEADER, BEGIN_PROGRAM, COMMENT, CREATED_AT_DATE, CREATED_AT_TIME, END_TAGS, FIRST_COMMAND_NO, LAST_COMMAND_NO, NAME, PROCESS_CODE, START_TAGS, UPDATED_AT_DATE, UPDATED_AT_TIME } from './constants'
import type { ProgramHeader } from '~/shared/types'

export function stringifyProgram(program: ProgramHeader) {
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
      const mainCommand = [
        step.mainCommand.commandNo,
        'F=1',
        `P=${stepCount}`,
        `IO=${step.mainCommand.ioList.map((io) => {
          if (io) {
            const value = step.mainCommand.ioList.find(
              ioSelectable => ioSelectable.value === io.value,
            )!.value as [number, number][]
            return `[${value.map(v => `(${v[0]},${v[1]})`).join('')}]`
          } else {
            return `[(${io})]`
          }
        }).join('')}`,
        `SP=${step?.mainCommand?.parameters?.map(parameter => parameter.value?.toFixed(2)).join(' ')}`,
      ].join(' ')

      const parallelCommands = step.parallelCommands.map((parallelCmd) => {
        const parts = [
          parallelCmd.commandNo,
          'F=1',
          `P=${stepCount}`,
          `IO=${parallelCmd.ioList.map((io) => {
            if (io) {
              const value = parallelCmd.ioList.find(
                ioSelectable => ioSelectable.value === io.value,
              )!.value as [number, number][]
              return `[${value.map(v => `(${v[0]},${v[1]})`).join('')}]`
            } else {
              return `[(${io})]`
            }
          }).join('')}`,
          `SP=${parallelCmd.parameters.map(parameter => parameter.value?.toFixed(2)).join(' ')}`,
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
