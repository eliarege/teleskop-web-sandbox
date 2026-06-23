import isEqual from 'fast-deep-equal'
import { isDef } from '@teleskop/utils'
import { ref } from 'vue'
import { klona } from 'klona'
import { useEditorStore } from './editor'
import type { CommandError, CommandIO, CommandIOSelection, CommandParameter, CommandTypes, MachineCommand, ParameterItem, Program, ProgramError, ProgramFilter, ProgramPDFPayloadMap, ProgramStep, ProgramStepCommand, StepError, StepIcon, ioListItem } from '~/shared/types'
import { commandTypeMaps } from '~/shared/constants'
import PdfWorker from '~/workers/pdf-generator.worker.ts?worker'

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

export function areCommandsEqual(stepA: ProgramStepCommand, stepB: ProgramStepCommand): boolean {
  if (!isDef(stepA) || !isDef(stepB)) {
    return false
  }
  if (stepA.commandNo !== stepB.commandNo) {
    return false
  }
  if (!areIOListsEqual(stepA.ioList, stepB.ioList)) {
    return false
  }
  if (!areParametersEqual(stepA.parameters, stepB.parameters)) {
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
function areIOListsEqual(ioListA: ioListItem[], ioListB: ioListItem[]): boolean {
  for (let index = 0; index < ioListA.length; index++) {
    const ioA = ioListA[index]
    const ioB = ioListB[index]

    if (!isDef(ioA) || !isDef(ioB)) {
      return false
    }

    if (ioA.value.length !== ioB.value.length) {
      return false
    }

    for (let valueIndex = 0; valueIndex < ioA.value.length; valueIndex++) {
      const valueA = ioA.value[valueIndex]
      const valueB = ioB.value[valueIndex]

      if (!isDef(valueA) || !isDef(valueB)) {
        return false
      }

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
function areParametersEqual(parametersA: ParameterItem[], parametersB: ParameterItem[]): boolean {
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
 * İki programı karşılaştırır ve aynı olup olmadığını döner.
 * @param programA Program
 * @param programB Program
 * @returns {boolean} Aynı ise true döner. Değilse false döner.
 */
export function areProgramsEqual(programA: Program, programB: Program): boolean {
  if (programA.steps.length !== programB.steps.length) {
    return false
  }

  // Steps
  for (let stepIndex = 0; stepIndex < programA.steps.length; stepIndex++) {
    const stepA = programA.steps[stepIndex]
    const stepB = programB.steps[stepIndex]

    if (!isDef(stepA) || !isDef(stepB)) {
      return false
    }

    // Main Command
    if (!areCommandsEqual(stepA.mainCommand, stepB.mainCommand)) {
      return false
    }
    // Parallel Commands
    for (let parallelIndex = 0; parallelIndex < stepA.parallelCommands.length; parallelIndex++) {
      const parallelCommandA = stepA.parallelCommands[parallelIndex]
      const parallelCommandB = stepB.parallelCommands[parallelIndex]

      if (!areCommandsEqual(parallelCommandA, parallelCommandB)) {
        return false
      }
    }
  }

  return true
}

interface Notification {
  message: string
  type: 'positive' | 'warning'
  date: Date
}

export const useNotificationStore = defineStore('notification', () => {
  const showNotificationPopup = ref<boolean>(false)

  const notifications = ref<Notification[]>(
    (JSON.parse(localStorage.getItem('notifications') || '[]') as Notification[]).map(n => ({
      ...n,
      date: new Date(n.date),
    })),
  )

  watch(notifications, (newVal) => {
    localStorage.setItem('notifications', JSON.stringify(newVal))
  }, { deep: true })

  function addNotification(message: string, type: 'positive' | 'warning') {
    notifications.value.unshift({
      message,
      type,
      date: new Date(),
    })
  }

  function removeNotification(index: number) {
    notifications.value.splice(index, 1)
  }

  return {
    showNotificationPopup,
    notifications,
    addNotification,
    removeNotification,
  }
})

export const useErrorStore = defineStore('program-errors', () => {
  const errors = ref<ProgramError[]>(JSON.parse(localStorage.getItem('program-errors') || '[]'))

  watch(errors, (newVal) => {
    localStorage.setItem('program-errors', JSON.stringify(newVal))
  }, { deep: true })

  function findProgram(machineId: number, programNo: number) {
    return errors.value.find(p => p.machineId === machineId && p.programNo === programNo)
  }

  function getProgramErrors(machineId: number, programNo: number): ProgramError | undefined {
    return findProgram(machineId, programNo)
  }

  function setErrors(machineId: number, programNo: number, stepErrors: StepError[]) {
    const index = errors.value.findIndex(p => p.machineId === machineId && p.programNo === programNo)

    if (stepErrors.length === 0) {
      if (index !== -1) {
        errors.value.splice(index, 1)
      }
      return
    }

    if (index !== -1) {
      errors.value[index].steps = stepErrors
    } else {
      errors.value.push({ machineId, programNo, steps: stepErrors })
    }
  }

  function clearStepErrors(machineId: number, programNo: number, stepId: number) {
    const program = findProgram(machineId, programNo)
    if (program) {
      program.steps = program.steps.filter(s => s.stepId !== stepId)
    }
  }

  function clearCommandErrors(machineId: number, programNo: number, stepId: number, commandId: number) {
    const program = findProgram(machineId, programNo)

    if (program) {
      const step = program.steps.find(s => s.stepId === stepId)

      if (step && step.commands) {
        step.commands = step.commands.filter(c => c.commandId !== commandId)

        if (step.commands.length === 0) {
          program.steps = program.steps.filter(s => s.stepId !== stepId)
        }
      }
    }
  }

  function getStepErrors(machineId: number, programNo: number, stepId: number): StepError[] {
    const program = findProgram(machineId, programNo)
    return program?.steps.filter(s => s.stepId === stepId) ?? []
  }

  function getCommandErrors(machineId: number, programNo: number, stepId: number, commandId: number): CommandError[] {
    const program = findProgram(machineId, programNo)
    const step = program?.steps.find(s => s.stepId === stepId)
    return step?.commands?.filter(c => c.commandId === commandId) ?? []
  }

  function addError(machineId: number, programNo: number, stepErrors: StepError[]) {
    const program = findProgram(machineId, programNo)
    if (program) {
      program.steps.push(...stepErrors)
    } else {
      errors.value.push({ machineId, programNo, steps: stepErrors })
    }
  }

  function clearErrors(machineId?: number, programNo?: number) {
    if (machineId !== undefined && programNo !== undefined) {
      errors.value = errors.value.filter(p => !(p.machineId === machineId && p.programNo === programNo))
    } else {
      errors.value = []
    }
  }

  return {
    errors,
    getProgramErrors,
    setErrors,
    clearStepErrors,
    clearCommandErrors,
    getStepErrors,
    getCommandErrors,
    addError,
    clearErrors,
  }
})

export const useProgramFilterStore = defineStore('filter', () => {
  const showFilterPopup = ref<boolean>(false)
  const existingFilter = ref<ProgramFilter>({
    clearOnChange: true,
  })

  function hasFilter(): boolean {
    return !!(existingFilter.value.programNo || existingFilter.value.programName || existingFilter.value.processType)
  }

  function clearFilter() {
    existingFilter.value = {
      clearOnChange: true,
    }
  }

  return { showFilterPopup, existingFilter, hasFilter, clearFilter }
})

/**
 * Verilen saniyeyi 00:00:00 formatına dönüştürür
 * @param duration Saniye cinsinden süre
 * @param hideZero True ise saat ve dakika sıfırsa gizlenir
 * @returns {string} Süreyi 00:00:00 formatında döndürür
 */
export function formatDuration(duration: number, hideZero?: boolean): string {
  if (!isDef(duration) || Number.isNaN(duration) || duration < 0) {
    return '00:00:00'
  }

  const hour = Math.floor(duration / 3600)
  const minute = Math.floor((duration % 3600) / 60)
  const second = Math.floor(duration % 60)

  if (hideZero) {
    if (hour === 0 && minute === 0) {
      return `00:${String(second).padStart(2, '0')}`
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

/**
 * Main step'te hata olup olmadığını kontrol eder
 * @param errorIds Hata ID'lerinin listesi (ör. '1-0', '2-3')
 * @returns {boolean} Eğer main step'te hata varsa true, yoksa false döner
 */
export function checkMainStepForErrors(errorIds: string[]): boolean {
  return errorIds.some((error) => {
    const [, commandId] = error.split('-')
    return Number(commandId) === 0
  })
}

/**
 * Program hatası olup olmadığını kontrol eder
 * @param {object} error Hata objesi
 * @param {string} message Hata mesajı
 * @returns {string} Hata key'i döndürür
 */
export function isProgramError(error: any, message: string): boolean {
  const status = error?.response?.status
  const errorMessage = error?.response?._data?.message

  if (status === 400 && errorMessage === message)
    return true

  return false
}

/** Adımı mevcut makinenin komut yapısına uyacak şekilde adapte eder */
export function adaptStepToMachine(step: ProgramStep, sourceMachineCommands: Map<number, MachineCommand>, isSameMachine: boolean): ProgramStep {
  const editor = useEditorStore()
  const emptyStep = editor.createEmptyStep()

  emptyStep.mainCommand = adaptCommand(step.mainCommand, sourceMachineCommands, isSameMachine)
  emptyStep.parallelCommands = step.parallelCommands
    .map(command => adaptCommand(command, sourceMachineCommands, isSameMachine))
    .filter(command => command.commandNo !== null)

  return emptyStep
}

/**
 * Komutu makine komutuna göre parametreler ve IO'larla birlikte adapte eder
 * Uyumluluk kontrolü akışı:
 * 1. Komut numarası hedef makinede var mı?
 * 2. Parametre sayıları ve indeksleri aynı mı?
 * 3. IO sayıları ve ID'leri aynı mı?
 * 4. Uyumluysa, IO kombinasyonlarını kontrol et ve geçerli olanları aktar
 */
export function adaptCommand(stepCommand: ProgramStepCommand, sourceMachineCommands: Map<number, MachineCommand>, isSameMachine: boolean): ProgramStepCommand {
  const editor = useEditorStore()
  const machine = useMachineStore()

  const targetMachineCommand = machine.currentMachine.commands.get(stepCommand.commandNo)
  const newCommand = editor.createEmptyCommand()

  // Komut hedef makinede yok
  if (!targetMachineCommand)
    return newCommand

  // Aynı makine ise direkt kopyala (yeni commandId ile)
  if (isSameMachine) {
    return {
      ...stepCommand,
      commandId: newCommand.commandId,
    }
  }

  const sourceMachineCommand = sourceMachineCommands.get(stepCommand.commandNo)

  // Kaynak makine komut bilgisi yoksa veya uyumsuzsa, varsayılan değerlerle devam et
  if (!sourceMachineCommand
    || !checkParametersCompatibility(sourceMachineCommand.parameters, targetMachineCommand.parameters)
    || !checkIOListCompatibility(sourceMachineCommand.ioList, targetMachineCommand.ioList)
  ) {
    editor.updateStepCommandFromDefinition(targetMachineCommand, newCommand)
    return newCommand
  }

  // Komutlar uyumlu, değerleri ve IO kombinasyonlarını aktar
  return {
    commandId: newCommand.commandId,
    commandNo: stepCommand.commandNo,
    parameters: klona(stepCommand.parameters),
    ioList: targetMachineCommand.ioList.map((targetIO, index) => {
      const stepIO = stepCommand.ioList[index]!
      return {
        ioId: targetIO.physicalId,
        ioIndex: targetIO.index,
        value: filterValidIOCombinations(stepIO.value, targetIO.selections),
      }
    }),
  }
}

/** Parametre uyumluluğunu kontrol eder */
function checkParametersCompatibility(
  sourceParams: CommandParameter[],
  targetParams: CommandParameter[],
): boolean {
  if (sourceParams.length !== targetParams.length)
    return false

  return sourceParams.every((sourceParam, i) => sourceParam.index === targetParams[i].index)
}

/** IO uyumluluğunu kontrol eder */
function checkIOListCompatibility(
  sourceIOList: CommandIO[],
  targetIOList: CommandIO[],
): boolean {
  if (sourceIOList.length !== targetIOList.length)
    return false

  return sourceIOList.every((sourceIO, i) => sourceIO.index === targetIOList[i].index)
}

/** IO kombinasyonlarını kontrol eder ve hedef makinede geçerli olanları filtreler */
function filterValidIOCombinations(
  sourceCombinations: [number, number][],
  targetSelections: CommandIOSelection[],
): [number, number][] {
  // Her kombinasyonun hedef makinenin seçeneklerinde olup olmadığını kontrol et
  return sourceCombinations.filter(([id1, id2]) => {
    return targetSelections.some(selection =>
      selection.index === id1 || selection.index === id2,
    )
  })
}

/**
 * Program PDF'i oluşturur
 * @param type PDF türü
 * @param payload PDF verisi
 * @returns  {Promise<Blob>} PDF Blob nesnesi
 */
export async function generateProgramPDF<T extends keyof ProgramPDFPayloadMap>(type: T, payload: ProgramPDFPayloadMap[T]): Promise<Blob> {
  const worker = new PdfWorker()

  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    worker.onmessage = (e) => {
      worker.terminate()
      e.data.success ? resolve(e.data.data) : reject(new Error(e.data.error))
    }

    worker.onerror = (error) => {
      worker.terminate()
      reject(error)
    }

    try {
      worker.postMessage({ type, payload: klona(payload) })
    } catch (error) {
      worker.terminate()
      reject(error)
    }
  })

  return new Blob([buffer], { type: 'application/pdf' })
}

export function downloadPDF(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export function printPDF(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, '_blank')
  if (printWindow) {
    printWindow.focus()
    printWindow.print()
  }
  URL.revokeObjectURL(url)
}

/**
 * Belirtilen namespace için çevirileri oluşturur
 * @param messages - Tüm mesajlar
 * @param locale - Geçerli dil
 * @param t - Çeviri fonksiyonu
 * @param namespace - Çeviri namespace'i
 * @returns Belirtilen namespace için çeviriler
 */
export function buildTranslations(
  messages: Record<string, any>,
  locale: string,
  t: (key: string) => string,
  namespace: string,
): Record<string, string> {
  return Object.keys(messages[locale][namespace]).reduce(
    (acc, key) => {
      acc[key] = t(`${namespace}.${key}`)
      return acc
    },
    {} as Record<string, string>,
  )
}

/**
 * Verilen bir komut numarası ile ilişkili ikonu döndürür.
 *
 * @param {Map<number, MachineCommand>} commands - Komutların bulunduğu harita.
 * @param {CommandTypes[]} commandTypes - Komut tipleri.
 * @param {number} commandNo - İkonun alınacağı komut numarası.
 *
 * @returns {StepIcon | undefined} Komutla ilişkili ikon veya eğer ikon bulunamazsa ya da seçim koşulları sağlanmazsa `undefined`.
 *
 * @description Bu fonksiyon, bir komut numarasının tanımlı olup olmadığını kontrol eder ve ilgili komutu ve komut tipini alır.
 * Ardından, komut tipinin bilinen bir eşlemeyle uyumlu olup olmadığını ve `teleskopSettings` içindeki ikon ayarlarına göre
 * ikonun gösterilip gösterilmeyeceğini belirler. Tüm koşullar sağlanırsa, uygun `StepIcon` döner; aksi takdirde `undefined` döner.
 */
export function getCommandIcon(commands: Map<number, MachineCommand>, commandTypes: CommandTypes[], commandNo: number): StepIcon | undefined {
  const teleskopSettings = useTeleskopSettingsStore()

  if (!isDef(commandNo))
    return

  const machineCommand = commands.get(commandNo)
  if (!machineCommand)
    return

  const machineCommandType = commandTypes.find(commandType => commandType.commandNo === commandNo)
  if (!machineCommandType)
    return

  const commandType = commandTypeMaps.find(map => map.value === machineCommandType.commandType)
  if (!commandType)
    return

  const iconSetting = teleskopSettings.selectedIcons
  const isSelected = (Number(iconSetting) & (1 << Number(commandType.index))) > 0

  if (!isSelected)
    return

  return { name: commandType.icon, label: commandType.title, color: commandType.color }
}

/**
 * Metni normalize eder, Türkçe karakterleri İngilizce karşılıklarına çevirir ve küçük harfe dönüştürür.
 * @param text Normalleştirilecek metin
 * @returns Normalleştirilmiş metin
 */
export function normalizeText(text?: string | null): string {
  if (!text)
    return ''

  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}
