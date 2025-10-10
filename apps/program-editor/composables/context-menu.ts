import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import type { Router } from 'vue-router'
import { isProgramError } from './utils'
import { notification } from '~/shared/functions'
import type { CopyItem, MachineCommand, MachineInfo, ProgramHeader, ProgramHeaderArchive, ProgramHeaderUpdate, ProgramItem, ProgramStep, ProgramStepCommand, ProgramTableRow, ProgramWithErrors } from '~/shared/types'

export interface ContextMenuStore {
  getCopiedValues: () => ProgramItem[]
  getCopiedStepsValues: () => ProgramStep[] | undefined
  comparisonBasketLength: () => number
  copy: (fromMachine: number, program: ProgramTableRow[]) => void
  paste: (machineId: number, remains?: CopyItem) => Promise<CopyItem>
  setCtx: (ctx?: any) => void
  deleteProgram: (selectedRows: ProgramTableRow[], selectedOption: string, machineId: number) => Promise<void>
  getProgram: (programNo: number, machineId: number) => Promise<ProgramWithErrors>
  updateProgramHeader: (machineId: number, programNo: number, program: ProgramHeaderUpdate) => Promise<boolean>
  getProgramHeader: (machineId: number, programNo: number,) => Promise<ProgramHeader>
  changeProcessType: (machineId: number, programs: ProgramTableRow[], typeData: { type: number, additionalType: number | null }) => Promise<void>
  sendProgram: (programs: ProgramTableRow[], machineId: number) => Promise<void>
  getRemoteProgram: (programs: ProgramTableRow[], machineId: number) => Promise<void>
  sendProgramToMachines: (programs: ProgramItem[], machines: MachineInfo[], machineId: number) => Promise<void>
  deleteProgramFromMachine: (programs: ProgramItem[], machines: MachineInfo[], source: string) => Promise<void>
  deleteVersions: (machineId: number, programNo: number, versions: number[]) => Promise<number[]>
  fetchVersions: (machineId: number, programNo: number) => Promise<void>
  setActiveVersion: (machineId: number, programNo: number, version: number, isOperatorEditable: boolean) => Promise<void>
  concatenatePrograms: (programs: ProgramTableRow[], programDetails: ProgramHeader, machineId: number) => Promise<boolean>
  comparison: () => void
  addToComparisonBasket: (machineId: number, programs: ProgramTableRow[]) => void
  clearComparisonBasket: () => void
  getComparisonBasket: () => { machineId: number, programNo: number }[]
  isThereCopiedValue: ComputedRef<boolean>
  programVersions: Ref<ProgramHeaderArchive[]>
  copyStep: () => void
  pasteStep: () => void
  getMachineStatus: (machineId: number) => Promise<boolean>
}

export function useContextMenuStore(ctx?: any): ContextMenuStore {
  const copiedValues = ref([] as ProgramItem[])
  const copiedStepValues = ref([] as { machineId: number, programNo: number, steps: ProgramStep[] }[])
  let comparsionBasket = [] as { machineId: number, programNo: number }[]

  const programVersions = ref([] as ProgramHeaderArchive[])

  // const machineId = Number(route.params.machine_id)
  let t = function (param: string, ...args: any[]) {
    return param
  }
  let router: Router = {} as Router
  function setCtx(ctx?: { t: any, router: Router }) {
    t = ctx?.t
    router = ctx?.router!
  }

  function copyStep() {
    const editor = useEditorStore()
    copiedStepValues.value = []
    editor.selectedSteps.forEach((step) => {
      copiedStepValues.value.push(step)
    })
  }

  /** Kopyalanan adımları mevcut programa yapıştırır ve makine komutlarına göre adapte eder */
  function pasteStep() {
    const editor = useEditorStore()
    editor.isLoading = true

    const stepIndex = getInsertionIndex(editor)
    editor.selectedSteps = []

    const copiedSteps = getCopiedStepsValues()
    copiedSteps?.forEach((step) => {
      const adaptedStep = adaptStepToMachine(step, editor)
      editor.selectedSteps.push(adaptedStep)
    })

    editor.program.steps.splice(stepIndex, 0, ...editor.selectedSteps)
    editor.isLoading = false
  }

  /** Adımların ekleneceği pozisyonu belirler (seçili adım varsa onun yerine, yoksa sona) */
  function getInsertionIndex(editor: ReturnType<typeof useEditorStore>): number {
    return editor.selectedSteps.length
      ? editor.program.steps.indexOf(editor.selectedSteps[0])
      : editor.program.steps.length
  }

  /** Adımı mevcut makinenin komut yapısına uyacak şekilde adapte eder */
  function adaptStepToMachine(step: ProgramStep, editor: ReturnType<typeof useEditorStore>): ProgramStep {
    const emptyStep = editor.createEmptyStep()
    const machineCommand = editor.machine.commands.get(step.mainCommand.commandNo)

    emptyStep.mainCommand = adaptCommand(step.mainCommand, machineCommand)
    emptyStep.parallelCommands = step.parallelCommands.map((command) => {
      const parallelMachineCommand = editor.machine.commands.get(command.commandNo)
      return adaptCommand(command, parallelMachineCommand)
    })

    return emptyStep
  }

  /** Komutu makine komutuna göre parametreler ve IO'larla birlikte adapte eder */
  function adaptCommand(stepCommand: ProgramStepCommand, machineCommand?: MachineCommand): ProgramStepCommand {
    return {
      ...stepCommand,
      parameters: adaptParameters(stepCommand.parameters, machineCommand?.parameters),
      ioList: adaptIOList(stepCommand.ioList, machineCommand?.ioList),
    }
  }

  /** Parametreleri makine komutuna göre validate eder, eksik değerler için default kullanır */
  function adaptParameters(stepParams: any[], machineParams?: any[]): any[] {
    if (!machineParams)
      return stepParams.map(param => ({ ...param }))

    return machineParams.map((machineParam, index) => {
      const stepParam = stepParams[index]
      return {
        index: machineParam.index,
        value: stepParam?.value ?? machineParam.value ?? 0,
        type: machineParam.type,
        optimized: stepParam?.optimized ?? false,
      }
    })
  }

  /** IO listesini makine komutuna göre validate eder, eksik değerler için default kullanır */
  function adaptIOList(stepIOList: any[], machineIOList?: any[]): any[] {
    if (!machineIOList)
      return stepIOList.map(io => ({ ...io }))

    return machineIOList.map((machineIO, index) => {
      const stepIO = stepIOList[index]
      return {
        ioId: machineIO.physicalId,
        ioIndex: machineIO.index,
        value: stepIO?.value ?? [[0, 0]],
      }
    })
  }

  function getCopiedStepsValues(): ProgramStep[] | undefined {
    return copiedStepValues.value
  }

  function getCopiedValues(): ProgramItem[] {
    return copiedValues.value
  }

  const isThereCopiedValue = computed(() => {
    return !!copiedValues.value.length
  })

  function clearComparisonBasket() {
    comparsionBasket = []
  }

  function addToComparisonBasket(machineId: number, programs: ProgramTableRow[]) {
    programs.forEach((program) => {
      if (!comparsionBasket.includes({ machineId, programNo: program.programNo }))
        comparsionBasket.push({ machineId, programNo: program.programNo })
    })
  }

  function comparison() {
    const path = `/comparison?m=${comparsionBasket[0].machineId}&p1=${comparsionBasket[0].programNo}&p2=${comparsionBasket[1].programNo}`
    clearComparisonBasket()
    navigateTo(path)
  }
  function getComparisonBasket() {
    return comparsionBasket
  }
  function comparisonBasketLength() {
    return comparsionBasket.length
  }

  function copy(fromMachine: number, programs: ProgramTableRow[]) {
    copiedValues.value = []
    programs.forEach(({ programNo, name }) => {
      copiedValues.value.push({ machineId: fromMachine, programNo, name })
    })
  }

  /**
   * copiedValues’da saklanan programları verilen makineye yapıştırır.
   * Eğer `remains` parametresi verilirse, yapıştırılacak programların kaynağı olarak bu kullanılır.
   * Aksi halde, copiedValues’da saklanan programlar kullanılır.
   * Metot, yapıştırılan programları içeren bir CopyItem nesnesi döner.
   * Dönen CopyItem’ın `program` özelliği, yapıştırılan programları içerir;
   * `fromMachineId` ve `toMachineId` özellikleri ise programların kopyalandığı ve yapıştırıldığı makine ID’lerini belirtir.
   *
   * @param machineId — Programların yapıştırılacağı makinenin ID’si
   * @param remains — Opsiyonel olarak yapıştırılacak programları içeren CopyItem nesnesi
   * @returns Yapıştırılan programları içeren bir CopyItem nesnesi
   */
  async function paste(machineId: number, remains?: CopyItem): Promise<CopyItem> {
    const editor = useEditorStore()
    const toPaste: CopyItem = { fromMachineId: 0, toMachineId: 0, program: [] }

    if (remains) {
      toPaste.fromMachineId = remains.fromMachineId
      toPaste.toMachineId = machineId
      toPaste.program.push(...remains.program)
    } else {
      copiedValues.value.forEach((item) => {
        toPaste.fromMachineId = item.machineId
        toPaste.toMachineId = machineId
        toPaste.program.push({ programNo: item.programNo, name: item.name, newProgramNo: null })
      })
    }

    const { fetch } = useKeycloak()
    const conflicts = await fetch('/api/copy', {
      method: 'POST',
      body: JSON.stringify({ copyProgram: toPaste }),
    })

    await editor.fetchAllPrograms()
    return conflicts
  }

  async function deleteProgram(selectedRows: ProgramTableRow[], selectedOption: string, machineId: number) {
    const { fetch } = useKeycloak()
    const { notifyError } = useNotify()
    const query = `source=${selectedOption}`

    for (const program of selectedRows) {
      try {
        const response = await fetch(`/api/machine/${machineId}/program/${program.programNo}?${query}`, {
          method: 'DELETE',
        })

        if (!response) {
          notifyError(t('contextMenu.delete.fail', { programNo: program.programNo }))
        }
      } catch (error) {
        console.error(`Error deleting program ${program.programNo}:`, error)
        notifyError(t('contextMenu.delete.fail', { programNo: program.programNo }))
      }
    }
  }

  async function getProgram(programNo: number, machineId: number): Promise<ProgramWithErrors> {
    const { fetch } = useKeycloak()
    const result = await fetch<ProgramWithErrors>(`/api/machine/${machineId}/program/${programNo}`)

    return result
  }

  async function getProgramHeader(machineId: number, programNo: number): Promise<ProgramHeader> {
    const { fetch } = useKeycloak()
    const result = await fetch<ProgramHeader>(`/api/machine/${machineId}/program/${programNo}/header`)

    return result
  }

  async function updateProgramHeader(machineId: number, programNo: number, program: ProgramHeaderUpdate): Promise<boolean> {
    const { fetch } = useKeycloak()
    const check = await fetch(`/api/machine/${machineId}/program/${programNo}/header`, {
      method: 'PUT',
      body: { program },
    })

    return !!check
  }

  async function changeProcessType(machineId: number, programs: ProgramTableRow[], typeData: { type: number, additionalType: number | null }) {
    const editor = useEditorStore()
    const { notifyError } = useNotify()
    editor.isLoading = true

    for (const program of programs) {
      try {
        await updateProgramHeader(machineId, program.programNo, {
          programNo: program.programNo,
          typeId: typeData.type,
          additionalTypeId: typeData.additionalType,
        })
      } catch (e) {
        notifyError(t(`contextMenu.changeProcessTypeNotification.fail`, { programNo: program.programNo }))
      }
    }
    editor.isLoading = false
  }

  async function sendProgram(programs: ProgramTableRow[], machineId: number): Promise<void> {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()
    const notificationState = useNotificationStore()
    const { notifySuccess, notifyError } = useNotify()

    editor.isLoading = true
    const isMultiplePrograms = programs.length > 3

    for (const program of programs) {
      try {
        await fetch(`/api/machine/${machineId}/program/${program.programNo}/upload`, { method: 'POST' })

        if (isMultiplePrograms) {
          notificationState.addNotification(t(`contextMenu.send.success`, { programNo: program.programNo }), 'positive')
        } else {
          notifySuccess(t(`contextMenu.send.success`, { programNo: program.programNo }))
        }
      } catch (error: any) {
        let messageKey = 'fail'

        if (isProgramError(error, 'PROGRAM_NOT_FOUND')) {
          messageKey = 'programNotFound'
        } else if (isProgramError(error, 'PROGRAM_HAS_ERRORS')) {
          messageKey = 'programHasErrors'
        }

        if (isMultiplePrograms) {
          notificationState.addNotification(t(`contextMenu.send.${messageKey}`, { programNo: program.programNo }), 'warning')
        } else {
          notifyError(t(`contextMenu.send.${messageKey}`, { programNo: program.programNo }))
        }
      }
    }
    editor.isLoading = false

    if (isMultiplePrograms) {
      notificationState.showNotificationPopup = true
    }
  }

  async function getRemoteProgram(programs: ProgramTableRow[], machineId: number): Promise<void> {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()
    const { notifySuccess, notifyError } = useNotify()
    editor.isLoading = true

    for (const program of programs) {
      try {
        await fetch(`/api/machine/${machineId}/program/${program.programNo}/download`, { method: 'POST' })
        notifySuccess(t(`contextMenu.get.success`, { programNo: program.programNo }))
      } catch (error: any) {
        let messageKey = 'fail'

        if (isProgramError(error, 'PROGRAM_NOT_FOUND')) {
          messageKey = 'programNotFound'
        }
        notifyError(t(`contextMenu.get.${messageKey}`, { programNo: program.programNo }))
      }
    }
    editor.isLoading = false
  }

  async function sendProgramToMachines(programs: ProgramItem[], machines: MachineInfo[], machineId: number): Promise<void> {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()
    const { notifySuccess, notifyError } = useNotify()
    editor.isLoading = true

    for (const machine of machines) {
      for (const program of programs) {
        try {
          const check = await fetch<boolean>(`/api/machine/${machineId}/program/${program.programNo}/uploadTo`, { method: 'POST', body: { machineId: machine.id } })

          if (check) {
            notifySuccess(t(`contextMenu.sendToMachine.success`, { name: program.name, machine: machine.name }))
          } else {
            notifyError(t(`contextMenu.sendToMachine.fail`, { name: program.name, machine: machine.name }))
          }
        } catch (error) {
          notifyError(t(`contextMenu.getInMachine.fail`, { name: program.name, machine: machine.name }))
        }
      }
    }
    editor.isLoading = false
  }

  async function deleteProgramFromMachine(programs: ProgramItem[], machines: MachineInfo[], source: string): Promise<void> {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()
    const { notifySuccess, notifyError } = useNotify()

    for (const machine of machines) {
      for (const program of programs) {
        try {
          editor.isLoading = true
          const check = await fetch<boolean>(`/api/machine/${machine.id}/program/${program.programNo}`, { method: 'DELETE', query: { source } })
          if (check)
            notifySuccess(t(`contextMenu.deleteFromMultiMachineNotification.success`, { name: program.name, programNo: program.programNo, machineId: machine.id }))
          else
            notifyError(t(`contextMenu.deleteFromMultiMachineNotification.fail`, { name: program.name, programNo: program.programNo, machineId: machine.id }))
        } catch (error) {
          notifyError(t(`contextMenu.deleteFromMultiMachineNotification.fail`, { name: program.name, programNo: program.programNo, machineId: machine.id }))
        } finally {
          editor.isLoading = false
        }
      }
    }
  }

  async function deleteVersions(machineId: number, programNo: number, versions: number[]): Promise<number[]> {
    const { fetch } = useKeycloak()

    return await fetch<number[]>(`/api/machine/${machineId}/program/${programNo}/version`, {
      method: 'DELETE',
      body: { versions },
    })
  }

  async function fetchVersions(machineId: number, programNo: number): Promise<void> {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()
    editor.isLoading = true

    try {
      programVersions.value = await fetch<ProgramHeaderArchive[]>(`/api/machine/${machineId}/program/${programNo}/version`, {
        method: 'GET',
      })
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      editor.isLoading = false
    }
  }

  async function setActiveVersion(machineId: number, programNo: number, version: number, isOperatorEditable: boolean): Promise<void> {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()
    editor.isLoading = true

    try {
      await fetch(`/api/machine/${machineId}/program/${programNo}/version/${version}`, {
        method: 'PUT',
        body: JSON.stringify({ isOperatorEditable }),
      })
    } finally {
      editor.isLoading = false
    }
  }

  async function concatenatePrograms(programs: ProgramTableRow[], programDetails: ProgramHeader, machineId: number) {
    const editor = useEditorStore()
    const { notifySuccess, notifyError } = useNotify()

    const newProgram = editor.createEmptyProgram()

    newProgram.machineId = machineId
    newProgram.programNo = programDetails.programNo
    newProgram.name = programDetails.name
    newProgram.typeId = programDetails.typeId
    newProgram.tbbProgramChangedEvent = programDetails.tbbProgramChangedEvent

    editor.isLoading = true
    try {
      for (const program of programs) {
        const { program: fetchedProgram } = await getProgram(program.programNo, machineId)
        newProgram.steps.push(...fetchedProgram.steps)
      }

      await editor.insertProgram(newProgram, false)

      notifySuccess(t('contextMenu.pasteNotification.success', { name: newProgram.name, programNo: newProgram.programNo }))
      return true
    } catch (error) {
      console.error('Error during program concatenation:', error)

      notifyError(t('contextMenu.pasteNotification.fail', { name: newProgram.name, programNo: newProgram.programNo }))
      return false
    } finally {
      editor.isLoading = false
    }
  }

  async function getMachineStatus(machineId: number): Promise<boolean> {
    const { fetch } = useKeycloak()
    const { notifyError } = useNotify()

    try {
      const status = await fetch<boolean>(`/api/machine/${machineId}/status`)

      return status
    } catch (error: any) {
      notifyError(t(`contextMenu.status.fail`, { machineId }))
      return false
    }
  }

  return {
    getCopiedValues,
    getCopiedStepsValues,
    comparisonBasketLength,
    copy,
    setCtx,
    paste,
    fetchVersions,
    setActiveVersion,
    sendProgramToMachines,
    deleteVersions,
    concatenatePrograms,
    deleteProgramFromMachine,
    getRemoteProgram,
    deleteProgram,
    getProgram,
    sendProgram,
    getProgramHeader,
    updateProgramHeader,
    changeProcessType,
    comparison,
    addToComparisonBasket,
    clearComparisonBasket,
    getComparisonBasket,
    isThereCopiedValue,
    programVersions,
    copyStep,
    pasteStep,
    getMachineStatus,
  }
}
