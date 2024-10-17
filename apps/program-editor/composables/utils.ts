import isEqual from 'fast-deep-equal'
import { useEditorStore } from './editor'
import type { CommandIO, CommandIOSelection, CommandParameter, MachineCommand, ParameterItem, ParameterSelections, Program, ProgramFilter, ProgramStepCommand, TeleskopSettings, ioListItem } from '~/shared/types'

export interface CommitState {
  insert: any[]
  update: any[]
  delete: any[]
}

export function between(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

export function omit<T extends Record<string, any>, K extends keyof T>(object: T, keys: K[]): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(object)
      .filter(([key]) => !keys.includes(key as K)),
  ) as Omit<T, K>
}

export function pick<T extends Record<string, any>, K extends keyof T>(object: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(
    Object.entries(object)
      .filter(([key]) => keys.includes(key as K)),
  ) as Pick<T, K>
}

export function propsAreEqual<T extends object, S extends Pick<T, K>, K extends keyof T & keyof S>(first: T, second: S, props: K[]) {
  return props.every(prop => first[prop] === (second as Pick<T, K>)[prop])
}

/** `v-model.number` modifier behaviour */
export function looseToNumber<T>(value: T): T | number {
  const n = Number.parseFloat(value as any)
  return Number.isNaN(n) ? value : n
}

export function toDate(date: string | null): Date | null {
  return date ? new Date(date) : null
}

export function * negativeIdGenerator(initial?: number): Generator<number, number> {
  let id = initial || -1
  while (true) {
    yield id--
  }
}

export function hasKeys(object: object): boolean {
  return Object.keys(object).length > 0
}

export function times<T>(size: number, iterator: (index: number) => T): T[] {
  return [...Array(size)].map((_, i) => iterator(i))
}

export function getDifference<T extends object>(value: T, target: T): Partial<T> | null {
  const keys = Object.keys(value) as (keyof T)[]
  const difference = keys.reduce((diff, key) => {
    if (!isEqual(value[key], target[key])) {
      diff[key] = value[key]
    }
    return diff
  }, {} as Partial<T>)
  return hasKeys(difference) ? difference : null
}

export function assertIndex(index: number, max: number): void {
  if (index < 0 && index > max) {
    throw new Error(`Invalid index: ${index}`)
  }
}

/**
 * Belirtilen komut numarasına sahip komutun bilgilerini getirir
 * @param commandNo - Komut numarası
 * @param parameterOrIoList - 'parameters' veya 'ioList'
 * @param index - Parametre veya IO index
 * @param selectionIndex - Parametre veya IO selection index
 * @returns - Komut bilgileri
 */
export function getMachineCommand(commandNo: number, parameterOrIoList?: 'parameters' | 'ioList', index?: number, selectionIndex?: number):
  MachineCommand | CommandParameter | CommandIO | ParameterSelections | CommandIOSelection | MachineCommand[] | CommandParameter[] | CommandIO[] | ParameterSelections[] | CommandIOSelection[] | undefined {
  const editor = useEditorStore()

  const command: MachineCommand | undefined = editor.machine.commands.get(commandNo)

  if (!command)
    return undefined

  if (parameterOrIoList) {
    if (index) {
      if (selectionIndex)
        return command[parameterOrIoList][index].selections[selectionIndex]
      else
        return command[parameterOrIoList][index]
    }
    return command[parameterOrIoList]
  }
  return command
}

/**
 * Farklılıklar bir veya daha fazla değişiklik kaydı olarak raporlanır.
 * Değişiklik kayıtları aşağıdaki yapıya sahiptir:
 *  kind - Değişimin türünü belirtir; Aşağıdakilerden biri olacaktır:
 *    N - Yeni eklenen bir özelliği/öğeyi belirtir
 *    D - Bir özelliğin/öğenin silindiğini gösterir
 *    E - Bir özelliğin/öğenin düzenlendiğini gösterir
 *    A - Bir dizide meydana gelen bir değişikliği belirtir
 *  path - Özellik yolu (sol taraftaki kökten)
 *  prgA - karşılaştırmanın sol tarafındaki değer
 *  prgB - karşılaştırmanın sağ tarafındaki değer
 *  index - Değişikliğin meydana geldiği dizi indeksini gösterir
 *  item - Dizi indeksinde meydana gelen değişikliği gösteren kaydı içerir
 */
export const diffs: any[] = []

/**
 * Programın header bilgilerini karsılastırır
 * @param programA Program
 * @param programB Program
 * @returns {boolean} Aynı ise true döner
 */
function compareHeader(programA: any, programB: any): boolean {
  for (const key of Object.keys(programA)) {
    if (programA[key] !== programB[key]) {
      diffs.push({ kind: 'E', path: key, prgA: programA[key], prgB: programB[key] })
      return false
    }
  }
  return true
}

export function compareCommand(stepA: ProgramStepCommand, stepB: ProgramStepCommand): boolean {
  if (stepA.commandNo !== stepB.commandNo) {
    return false
  }
  if (!compareIOLists(stepA.ioList, stepB.ioList)) {
    return false
  }
  if (!compareParameters(stepA.parameters, stepB.parameters)) {
    return false
  }
  return true
}

/**
 * Programın ioList bilgilerini karsılastırır
 * @param ioListA IO Listesi
 * @param ioListB IO Listesi
 * @returns {boolean} Aynı ise true döner
 */
function compareIOLists(ioListA: ioListItem[], ioListB: ioListItem[]): boolean {
  for (let index = 0; index < ioListA.length; index++) {
    const ioA = ioListA[index]
    const ioB = ioListB[index]

    for (let valueIndex = 0; valueIndex < ioA.value.length; valueIndex++) {
      const valueA = ioA.value[valueIndex]
      const valueB = ioB.value[valueIndex]

      if (valueA[0] !== valueB[0] || valueA[1] !== valueB[1]) {
        return false
      }
    }
  }
  return true
}

/**
 * Programın parametre bilgilerini karsılastırır
 * @param parametersA Parametre Listesi
 * @param parametersB Parametre Listesi
 * @returns {boolean} Aynı ise true döner
 */
function compareParameters(parametersA: ParameterItem[], parametersB: ParameterItem[]): boolean {
  for (let index = 0; index < parametersA.length; index++) {
    const parameterA = parametersA[index]
    const parameterB = parametersB[index]

    if (parameterA.value !== parameterB.value) {
      return false
    }
  }
  return true
}

/**
 * İki programı karşılastırır ve farkları diffs dizisine aktarır.
 * @param programA Program
 * @param programB Program
 * @param noEmitOnDiff Fark bulunduğunda dursun mu?
 * @returns {boolean} Aynı ise true döner
 */
export function compareProgram(programA: Program, programB: Program, noEmitOnDiff?: boolean): boolean {
  // Header
  if (!compareHeader(programA, programB)) {
    if (noEmitOnDiff)
      return false
  }

  // Steps
  for (let stepIndex = 0; stepIndex < programA.steps.length; stepIndex++) {
    const stepA = programA.steps[stepIndex]
    const stepB = programB.steps[stepIndex]

    // Main Command
    if (!compareCommand(stepA.mainCommand, stepB.mainCommand)) {
      diffs.push({ kind: 'E', path: ['steps', stepIndex, 'mainCommand'], prgA: stepA.mainCommand, prgB: stepB.mainCommand })
      if (noEmitOnDiff)
        return false
    }
    // Parallel Commands
    for (let parallelIndex = 0; parallelIndex < stepA.parallelCommands.length; parallelIndex++) {
      const parallelCommandA = stepA.parallelCommands[parallelIndex]
      const parallelCommandB = stepB.parallelCommands[parallelIndex]

      if (!compareCommand(parallelCommandA, parallelCommandB)) {
        diffs.push({ kind: 'E', path: ['steps', stepIndex, 'parallelCommands', parallelIndex], prgA: parallelCommandA, prgB: parallelCommandB })
        if (noEmitOnDiff)
          return false
      }
    }
  }

  return true
}

let existingFilter: ProgramFilter | null = {
  programNo: 1,
  programName: '',
  processType: { value: 1, label: '' },
  clearOnChange: true,
}

export function setExistingFilter(filter: ProgramFilter | null) {
  existingFilter = filter
}

export function getExistingFilter() {
  if (existingFilter && existingFilter.clearOnChange)
    return false
  return existingFilter
}

export function clearFilter() {
  setExistingFilter(null)
}

export function filterToQuery(filter: ProgramFilter): string {
  let query = ''
  if (filter.programNo)
    query += `programNo=${filter.programNo}&`
  if (filter.programName)
    query += `programName=${filter.programName}&`
  if (filter.processType)
    query += `processType=${filter.processType.value}&`
  setExistingFilter(filter)
  return query
}

/**
 * Verilen saniyeyi 00:00:00 formatına dönüştürür
 * @param duration Saniye cinsinden süre
 * @param hideZero True ise saat ve dakika sıfırsa gizlenir
 * @returns {string} Süreyi 00:00:00 formatında döndürür
 */
export function formatDuration(duration: number, hideZero?: boolean): string {
  if (duration === undefined || duration === null || isNaN(duration) || duration < 0) {
    return '00:00:00'
  }

  const hour = Math.floor(duration / 3600)
  const minute = Math.floor((duration % 3600) / 60)
  const second = Math.floor(duration % 60)

  if (hideZero) {
    if (hour === 0 && minute === 0) {
      return String(second).padStart(2, '0')
    } else if (hour === 0) {
      return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
    }
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}


/**
 * 00:00:00 formatını saniyeye dönüştürür
 * @param duration string
 * @returns {number} Saniye
 */
export function parseDuration(duration: string): number {
  if (duration.includes(':')) {
    const [hour, minute, second] = duration.split(':')
    return Number(hour) * 3600 + Number(minute) * 60 + Number(second)
  }
  return Number(duration) * 36000
}
