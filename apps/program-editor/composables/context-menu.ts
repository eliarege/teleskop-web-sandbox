import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import type { Router } from 'vue-router'
import { notification } from '~/shared/functions'
import type { CopyItem, MachineInfo, ProcessType, Program, ProgramHeader, ProgramHeaderUpdate, ProgramItem, ProgramStep } from '~/shared/types'

export interface ContextMenuStore {
  getCopiedValues: () => ProgramItem[]
  getCopiedStepsValues: (machineId: number, programNo: number) => { machineId: number, programNo: number, steps: ProgramStep[] } | undefined
  comparisonBasketLength: () => number
  copy: (fromMachine: number, program: ProgramItem[]) => void
  paste: (machineId: number, remains?: CopyItem) => Promise<CopyItem>
  setCtx: (ctx?: any) => void
  deleteProgram: (selectedRows: ProgramItem[], selectedOption: number, machineId: number) => Promise<void>
  getProgram: (programNo: number, machineId: number) => Promise<Program>
  updateProgramHeader: (machineId: number, programNo: number, program: ProgramHeaderUpdate) => Promise<boolean>
  getProgramHeader: (machineId: number, programNo: number,) => Promise<ProgramHeader>
  getProcessTypes: () => Promise<ProcessType[]>
  changeProcessType: (machineId: number, programs: ProgramItem[], newType: number) => Promise<void>
  sendProgram: (programs: ProgramItem[], machineId: number) => Promise<void>
  getRemoteProgram: (programs: ProgramItem[], machineId: number) => Promise<void>
  sendProgramToMachines: (programs: ProgramItem[], machines: MachineInfo[], machineId: number) => Promise<void>
  deleteProgramFromMachine: (programs: ProgramItem[], machines: Array<any>, source: string) => Promise<void>
  deleteVersion: (versions: Array<{ programNo: number, version: number, name: string }>, machineId: number) => Promise<void>
  fetchVersions: (programNo: number, machineId: number) => Promise<any[]>
  concatenatePrograms: (programs: ProgramItem[], programDetails: ProgramHeader, machineId: number) => Promise<boolean>
  comparison: () => void
  addToComparisonBasket: (machineId: number, programs: ProgramItem[]) => void
  clearComparisonBasket: () => void
  getComparisonBasket: () => { machineId: number, programNo: number }[]
  isThereCopiedValue: ComputedRef<boolean>
  copyStep: () => void
  pasteStep: () => void
}

export function useContextMenuStore(ctx?: any): ContextMenuStore {
  const copiedValues = ref([] as ProgramItem[])
  const copiedStepValues = ref([] as { machineId: number, programNo: number, steps: ProgramStep[] }[])
  let comparsionBasket = [] as { machineId: number, programNo: number }[]

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
      const hasValue = copiedStepValues.value.find(value => value.machineId === editor.machine.id && value.programNo === editor.program.programNo)
      if (hasValue) {
        hasValue.steps.push(step)
      } else {
        copiedStepValues.value.push({ machineId: editor.machine.id, programNo: editor.program.programNo, steps: [step] })
      }
    })
  }

  function pasteStep() {
    const editor = useEditorStore()
    editor.isLoading = true

    let stepIndex = editor.program.steps.length
    if (editor.selectedSteps.length) {
      stepIndex = editor.program.steps.indexOf(editor.selectedSteps[0])
    }

    editor.selectedSteps = []

    const copiedSteps = getCopiedStepsValues(editor.machine.id, editor.program.programNo)

    copiedSteps?.steps.forEach((step) => {
      const emptyStep = editor.createEmptyStep()
      emptyStep.mainCommand = { ...step.mainCommand }
      emptyStep.parallelCommands = step.parallelCommands.map((command) => {
        return { ...command }
      })
      for (const command of emptyStep.parallelCommands) {
        const emptyCommand = editor.createEmptyCommand()
        emptyCommand.parameters = command.parameters.map((parameter) => {
          return { ...parameter }
        })
        emptyCommand.ioList = command.ioList.map((io) => {
          return { ...io }
        })
      }
      editor.selectedSteps.push(emptyStep)
    })
    editor.program.steps.splice(stepIndex, 0, ...editor.selectedSteps)
    editor.isLoading = false
  }

  function getCopiedStepsValues(machineId: number, programNo: number): { machineId: number, programNo: number, steps: ProgramStep[] } | undefined {
    return copiedStepValues.value.find(value => value.machineId === machineId && value.programNo === programNo)
  }

  function getCopiedValues() {
    return copiedValues.value
  }

  const isThereCopiedValue = computed(() => {
    return !!copiedValues.value.length
  })

  function clearComparisonBasket() {
    comparsionBasket = []
  }

  function addToComparisonBasket(machineId: number, programs: ProgramItem[]) {
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

  function copy(fromMachine: number, programs: ProgramItem[]) {
    copiedValues.value = []
    programs.forEach(({ programNo, name }) => {
      copiedValues.value.push({ machineId: fromMachine, programNo, name })
    })
  }

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
    editor.selectedPrograms = getCopiedValues()
    return conflicts
  }

  async function deleteProgram(selectedRows: ProgramItem[], selectedOption: number, machineId: number) {
    const { fetch } = useKeycloak()
    const query = `source=${selectedOption}`

    const deletionTasks = selectedRows.map(async (program) => {
      try {
        const response = await fetch(`/api/machine/${machineId}/program/${program.programNo}?${query}`, {
          method: 'DELETE',
        })

        const status = response ? 'success' : 'fail'
        notification(response, t(`contextMenu.delete.${status}`, { programNo: program.programNo, name: program.name,
        }))
      } catch (error) {
        console.error(`Error deleting program ${program.programNo}:`, error)
        notification(false, t('contextMenu.delete.fail', { programNo: program.programNo, name: program.name,
        }))
      }
    })

    await Promise.all(deletionTasks)
  }

  async function getProgram(programNo: number, machineId: number): Promise<Program> {
    const { fetch } = useKeycloak()
    return await fetch(`/api/machine/${machineId}/program/${programNo}`)
  }

  async function getProgramHeader(machineId: number, programNo: number): Promise<ProgramHeader> {
    const { fetch } = useKeycloak()
    return await fetch(`/api/machine/${machineId}/program/${programNo}/header`)
  }

  async function updateProgramHeader(machineId: number, programNo: number, program: ProgramHeaderUpdate): Promise<boolean> {
    const { fetch } = useKeycloak()
    const check = await fetch(`/api/machine/${machineId}/program/${programNo}/header`, {
      method: 'PUT',
      body: { program },
    })

    return !!check
  }

  async function getProcessTypes(): Promise<ProcessType[]> {
    const { fetch } = useKeycloak()
    return await fetch('/api/process')
  }

  async function changeProcessType(machineId: number, programs: ProgramItem[], newType: number) {
    for (const program of programs) {
      try {
        const check = await updateProgramHeader(machineId, program.programNo, {
          programNo: program.programNo,
          typeId: newType,
        })

        const status = check ? 'success' : 'fail'
        notification(!!check, t(`contextMenu.changeProcessTypeNotification.${status}`, { programNo: program.programNo }))
      } catch (e) {
        notification(false, t(`contextMenu.changeProcessTypeNotification.fail`, { programNo: program.programNo }))
      }
    }
  }

  async function sendProgram(programs: ProgramItem[], machineId: number) {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()

    editor.isLoading = true

    try {
      for (const program of programs) {
        try {
          const response = await fetch(`/api/machine/${machineId}/program/${program.programNo}/upload`, { method: 'POST' })

          let success = true
          let messageKey = 'success'
          let params = { name: program.name, programNo: program.programNo }

          if (response === 'PROGRAM_HAS_ERRORS') {
            success = false
            messageKey = 'programHasErrors'
            params = { name: program.name, programNo: program.programNo }
          } else if (response !== true) {
            success = false
            messageKey = 'fail'
          }

          notification(success, t(`contextMenu.send.${messageKey}`, params))
        } catch (error) {
          console.error(`Upload failed for program ${program.programNo}`, error)
          notification(false, t('contextMenu.send.fail', { name: program.name }))
        }
      }
    } finally {
      editor.isLoading = false
    }
  }

  async function getRemoteProgram(programs: ProgramItem[], machineId: number): Promise<void> {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()

    for (const program of programs) {
      try {
        editor.isLoading = true
        const check = await fetch(`/api/machine/${machineId}/program/${program.programNo}/download`, { method: 'POST' })
        notification(check, t(`contextMenu.get.${check ? 'success' : 'fail'}`, { programNo: program.programNo, name: program.name }))
      } catch (error) {
        notification(false, t(`contextMenu.get.fail`, { programNo: program.programNo, name: program.name }))
      } finally {
        editor.isLoading = false
      }
    }
  }

  async function sendProgramToMachines(programs: ProgramItem[], machines: MachineInfo[], machineId: number): Promise<void> {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()

    for (const machine of machines) {
      for (const program of programs) {
        try {
          editor.isLoading = true
          const check = await fetch(`/api/machine/${machineId}/program/${program.programNo}/uploadTo`, { method: 'POST', body: { machineId: machine.id } })
          notification(check, t(`contextMenu.getInMachine.${check ? 'success' : 'fail'}`, { name: program.name, machine: machine.id }))
        } catch (error) {
          notification(false, t(`contextMenu.getInMachine.fail`, { name: program.name, machine: machine.id }))
        } finally {
          editor.isLoading = false
        }
      }
    }
  }

  async function deleteProgramFromMachine(programs: ProgramItem[], machines: MachineInfo[], source: string): Promise<void> {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()

    for (const machine of machines) {
      for (const program of programs) {
        try {
          editor.isLoading = true
          const check = await fetch(`/api/machine/${machine.id}/program/${program.programNo}`, { method: 'DELETE', query: { source } })
          notification(check, t(`contextMenu.deleteFromMultiMachineNotification.${check ? 'success' : 'fail'}`, { name: program.name, programNo: program.programNo, machineId: machine.id }))
        } catch (error) {
          notification(false, t(`contextMenu.deleteFromMultiMachineNotification.fail`, { name: program.name, programNo: program.programNo, machineId: machine.id }))
        } finally {
          editor.isLoading = false
        }
      }
    }
  }

  async function deleteVersion(versions: Array<any>, machineId: number) {
    const { fetch } = useKeycloak()
    for (const version of versions) {
      const check = await fetch(`/api/machine/${machineId}/program/${version.programNo}/archive/${version.version}`, {
        method: 'DELETE',
      })
      const status = check ? 'success' : 'fail'
      notification(check, t(`contextMenu.delete.${status}`, { programNo: version.programNo, name: version.name }))
    }
  }

  async function fetchVersions(programNo: number, machineId: number): Promise<any[]> {
    const { fetch } = useKeycloak()
    return await fetch(`/api/machine/${machineId}/program/${programNo}/version`)
  }

  async function concatenatePrograms(programs: ProgramItem[], programDetails: ProgramHeader, machineId: number) {
    const editor = useEditorStore()

    const newProgram = editor.createEmptyProgram()

    newProgram.machineId = machineId
    newProgram.programNo = programDetails.programNo
    newProgram.name = programDetails.name
    newProgram.typeId = programDetails.typeId
    newProgram.tbbProgramChangedEvent = programDetails.tbbProgramChangedEvent

    editor.isLoading = true
    try {
      for (const program of programs) {
        const fetchedProgram = await getProgram(program.programNo, machineId)
        newProgram.steps.push(...fetchedProgram.steps)
      }

      await editor.insertProgram(newProgram, false)

      notification(true, t('contextMenu.pasteNotification.success', { name: newProgram.name, programNo: newProgram.programNo }))
      return true
    } catch (error) {
      console.error('Error during program concatenation:', error)

      notification(false, t('contextMenu.pasteNotification.fail', { name: newProgram.name, programNo: newProgram.programNo }))
      return false
    } finally {
      editor.isLoading = false
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
    sendProgramToMachines,
    deleteVersion,
    concatenatePrograms,
    deleteProgramFromMachine,
    getRemoteProgram,
    getProcessTypes,
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
    copyStep,
    pasteStep,
  }
}
