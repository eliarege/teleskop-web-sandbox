import { Notify } from 'quasar'
import { interpolateNumber } from 'd3'
import { format } from 'date-fns'
import type { AnalogInputOutputType, CalculatedValue, Counter, DigitalInputOutputType, Program } from '~/types/archive'
import type { DuoRaw } from '~/types/utils'

export function formatDuration(sec: string | number | Date | null | undefined, dateFormat: string = 'HH:mm:ss'): string {
  if (sec === null || sec === undefined || sec === '')
    return '-'

  if (sec instanceof Date || (typeof sec === 'string' && Number.isNaN(Number(sec)))) {
    return formatDatetime(sec, dateFormat)
  }

  const numSec = Number(sec)
  const totalSeconds = Math.abs(Math.floor(numSec))

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600) // Kalan saati bul
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const sign = numSec < 0 ? '-' : ''
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  if (days > 0) {
    return `${sign}${days}g ${timeString}`
  }

  return `${sign}${timeString}`
}

export function getApproxIoValueAtTime(
  time: Date,
  ioValues: Array<{ time: string, value: number }>,
  strategy: 'closestTime' | 'lastTime' | 'interpolated' = 'interpolated',
): { time: string, value: number } {
  const selectedTime = time.getTime()
  const sortedIoValues = ioValues.toSorted((a, b) =>
    new Date(a.time).getTime() - new Date(b.time).getTime(),
  )

  if (strategy === 'closestTime') {
    // Exit if we the diff increases, since the array is sorted
    let closest = { time: '', value: 0 }
    let closestDiff = Number.POSITIVE_INFINITY
    for (const current of sortedIoValues) {
      const currentTime = new Date(current.time).getTime()
      const currentDiff = Math.abs(currentTime - selectedTime)

      if (currentDiff < closestDiff) {
        closest = current
        closestDiff = currentDiff
      } else if (currentDiff > closestDiff) {
        break
      }
    }
    return closest
  } else if (strategy === 'lastTime') {
    let last = { time: '', value: 0 }
    for (const current of sortedIoValues) {
      const currentTime = new Date(current.time).getTime()
      if (currentTime <= selectedTime) {
        last = current
      } else {
        break
      }
    }
    return last
  } else if (strategy === 'interpolated') {
    let beforePoint = null
    let afterPoint = null

    for (let i = 0; i < sortedIoValues.length; i++) {
      const pointTime = new Date(sortedIoValues[i].time).getTime()
      if (pointTime > selectedTime) {
        afterPoint = sortedIoValues[i]
        beforePoint = i > 0 ? sortedIoValues[i - 1] : null
        break
      }
    }

    if (!afterPoint && sortedIoValues.length > 0) {
      beforePoint = sortedIoValues[sortedIoValues.length - 1]
    }

    if (beforePoint && afterPoint) {
      const beforeTime = new Date(beforePoint.time).getTime()
      const afterTime = new Date(afterPoint.time).getTime()
      const t = (selectedTime - beforeTime) / (afterTime - beforeTime)

      const interpolator = interpolateNumber(beforePoint.value, afterPoint.value)
      const interpolatedValue = interpolator(t)

      return {
        time: time.toISOString(),
        value: interpolatedValue,
      }
    } else if (beforePoint) {
      return beforePoint
    } else if (afterPoint) {
      return afterPoint
    }
  }

  return { time: '', value: 0 }
}

export function getCommandsWithClosestTime(
  slcTime: Date,
  commands: DuoRaw<AnalogInputOutputType[] | DigitalInputOutputType[] | Counter[] | CalculatedValue[]>,
  getWith: 'closestTime' | 'lastTime' | 'interpolated' = 'lastTime',
) {
  return commands.map((io) => {
    const values = io?.ioValues ?? []
    const closestIoValue = values.length > 0
      ? getApproxIoValueAtTime(slcTime, values, getWith)
      : { time: '', value: 0 }
    return {
      ...io,
      closestIoValue,
    }
  })
}

export function getCommandsWithClosestTimeDigital(
  slcTime: Date,
  commands: AnalogInputOutputType[] | DigitalInputOutputType[],
) {
  const selectedTime = slcTime.getTime()

  return commands.map((io) => {
    const closestIoValue = io?.ioValues?.length > 0
      ? io.ioValues.reduce((closest, current) => {
        const currentTime = new Date(current.time).getTime()
        const closestTime = closest.time ? new Date(closest.time).getTime() : Number.NEGATIVE_INFINITY

        // Only consider times less than the selected time
        if (currentTime >= selectedTime)
          return closest

        const currentDiff = selectedTime - currentTime
        const closestDiff = selectedTime - closestTime

        return closestTime === Number.NEGATIVE_INFINITY || currentDiff < closestDiff ? current : closest
      }, { time: '', value: 0 })
      : { time: '', value: 0 }

    return {
      ...io,
      closestIoValue,
    }
  })
}

export function setAxisVisibility(keyParam: string, changeTo: boolean) {
  const { t } = useNuxtApp().$i18n
  const settingsStore = userSettingsStore()
  let count = 0
  settingsStore.axises.forEach((axis) => {
    if (axis.visible && !axis.isDefault)
      count += 1
  })
  const axx = settingsStore.axises.get(keyParam)
  if (!axx)
    return
  if (count >= 4 && !axx.visible && changeTo) {
    Notify.create({
      message: t('errors.cannotShowMoreThanFourAxis'),
      group: 'axisError',
      type: 'negative',
      position: 'top',
    })
  } else {
    axx.visible = changeTo
  }
}

export function flattenPrograms(programs: Program[]) {
  return programs.flatMap((program, programIndex) => {
    return program.steps.flatMap((step, mainStep) => {
      return [
        {
          programNo: program.programNo,
          programName: program.name,
          programIndex,
          mainStep,
          parallelStep: 0,
          commandNo: step.mainCommand.commandNo,
          parameters: step.mainCommand.parameters,
          ioList: step.mainCommand.ioList,
        },
        ...step.parallelCommands.map((command, parallelIndex) => {
          return {
            programNo: program.programNo,
            programName: program.name,
            programIndex,
            mainStep,
            parallelStep: parallelIndex + 1,
            commandNo: command.commandNo,
            parameters: command.parameters,
            ioList: command.ioList,
          }
        }),
      ]
    })
  })
}

export function orderArray(array: Array<any>, predefinedOrder: Array<number | string | boolean>, key?: string) {
  const orderedData = array.sort((a: any, b: any) => {
    const indexA = predefinedOrder.indexOf(key ? a[key] : a)
    const indexB = predefinedOrder.indexOf(key ? b[key] : b)
    if (indexA === -1 && indexB === -1)
      return 0 // Both are unordered
    if (indexA === -1)
      return 1 // a is unordered, comes after b
    if (indexB === -1)
      return -1 // b is unordered, comes after a
    return indexA - indexB
  })
  return orderedData
}

export function formatDatetime(date: Date | string | number = new Date(), formatStr: string = 'dd/MM/yyyy HH:mm:ss'): string {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? '-' : format(d, formatStr)
}
