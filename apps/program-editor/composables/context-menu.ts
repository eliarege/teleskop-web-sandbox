import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import { notification } from '~/shared/functions'
import type { Program, ProgramTable } from '~/shared/types'
import type { Router } from 'vue-router'
import { ProgramStatus } from '~/shared/constants'

interface ProgramHeader {
  programNo: number
  name: string
}
export interface ContextMenuStore {
  getCopiedValues: () => Array<{ machine: number, program: ProgramTable, newProgramNo?: number }>
  comparisonBasketLength: () => number
  copy: (program: ProgramTable[], fromMachine: number) => void
  paste: (machineId: number, directPasteValues?: Array<{ machine: number, program: Program, newProgramNo?: number }>) => Promise<Array<{ machine: number, program: Program }>>
  setCtx: (ctx?: any) => void
  deleteProgram: (selectedRows: Array<ProgramHeader>, selectedOption: number, machineId: number) => Promise<void>
  getProgram: (programNo: number, machineId: number) => Promise<Program>
  changeName: (programNo: number, newName: string, machineId: number) => Promise<void>
  getProcessTypes: () => Promise<any[]>
  changeProcessType: (selectedRows: Array<{ programNo: number }>, newType: number, machineId: number) => Promise<void>
  sendProgram: (programs: Array<ProgramHeader>, machineId: number) => Promise<void>
  getRemoteProgram: (programs: Array<ProgramTable>, machineId: number) => Promise<void>
  sendProgramToMachines: (programs: Array<ProgramHeader>, machines: Array<any>, machineId: number) => Promise<void>
  deleteProgramFromMachine: (programs: Array<ProgramHeader>, machines: Array<any>, source: string) => Promise<void>
  deleteVersion: (versions: Array<{ programNo: number, version: number, name: string }>, machineId: number) => Promise<void>
  fetchVersions: (programNo: number, machineId: number) => Promise<any[]>
  concatenatePrograms: (programs: Array<{ programNo: number }>, details: { programNo: number, processType: { label: string, value: number }, name: string, creationTime: Date }, machineId: number) => Promise<void>
  comparison: () => void
  addToComparisonBasket: (e: any, machineId: number) => void
  clearComparisonBasket: () => void
  getComparisonBasket: () => Array<{ program: Program, machineId: number }>
  isThereCopiedValue: ComputedRef<boolean>
}

export function useContextMenuStore(ctx?: any): ContextMenuStore {
  const copiedValues = ref([] as Array<{ machine: number, program: ProgramTable, newProgramNo?: number }>)
  let comparsionBasket: any[] = []
  // const machineId = Number(route.params.machine_id)
  let t = function (param: string, ...args: any[]) {
    return param
  }
  let router: Router = {} as Router
  function setCtx(ctx?: { t: any, router: Router }) {
    t = ctx?.t
    router = ctx?.router!

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

  function addToComparisonBasket(e: any, machineId: number) {
    e.forEach((element) => {
      if (!comparsionBasket.includes([element.programNo, machineId]))
        comparsionBasket.push([element.programNo, machineId])
    })
  }

  function comparison() {
    const path = `/comparison?m=${comparsionBasket[0][1]}&p1=${comparsionBasket[0][0]}&p2=${comparsionBasket[1][0]}`
    clearComparisonBasket()
    console.log(path)
    router.push(path)
  }
  function getComparisonBasket() {
    return comparsionBasket
  }
  function comparisonBasketLength() {
    return comparsionBasket.length
  }

  function copy(selectedPrograms: ProgramTable[], fromMachine: number) {
    copiedValues.value = []
    selectedPrograms.forEach((program) => {
      copiedValues.value.push({ machine: fromMachine, program })
    })
  }

  async function paste(machineId: number, directPasteValues?: Array<{ machine: number, program: any, newProgramNo?: number }>) {
    const operationValues = directPasteValues || copiedValues.value
    const remains: { machine: number, program: any }[] = []
    const pastedValues: { machine: number, program: any }[] = []
    for (const val of operationValues) {
      const returnValue = await createProgramOnPaste(val, machineId)
      if (returnValue === 0)
        remains.push(val)
      else {
        pastedValues.push(val)
        notification(true, t('contextMenu.pasteNotification.success', { name: val.program.name, programNo: val.newProgramNo ? val.newProgramNo : val.program.programNo }))
      }
    }
    return remains
    // TODO: Command contextmenu.paste() i kullanamlı ardından remains dönmeli pastedValues'i redo undo stacke kaydedip ona göre delete atmalı
  }

  async function createProgramOnPaste(copiedValue: { machine?: number, program: Program, newProgramNo?: number }, machineId: number): Promise<number> {
    const { fetch } = useKeycloak()
    try {
      return await fetch(`/api/machine/${machineId}/program`, {
        method: 'POST',
        body: {
          newProgramNo: Number(copiedValue.newProgramNo),
          programNo: Number(copiedValue.program.programNo),
          machineIdOfCopiedProgram: copiedValue.machine,
        },
      })
    } catch (e: any) {
      if (e.data.data.code === 'PROGRAM_EXISTS') {
        return 0
      }
      throw e
    }
  }

  async function deleteProgram(selectedRows: any[], selectedOption: number, machineId: number) {
    const { fetch } = useKeycloak()
    const query = `source=${selectedOption}`
    for (const program of selectedRows) {
      const check = await fetch(`/api/machine/${machineId}/program/${program.programNo}?${query}`, {
        method: 'DELETE',
      })
      const status = check ? 'success' : 'fail'
      notification(check, t(`contextMenu.delete.${status}`, { programNo: program.programNo, name: program.name }))
    }
  }
  async function getProgram(programNo: number, machineId: number): Promise<Program> {
    const { fetch } = useKeycloak()
    return await fetch(`/api/machine/${machineId}/program/${programNo}`)
  }

  async function changeName(programNo: number, newName: string, machineId: number) {
    const program = await getProgram(programNo, machineId)

    program.name = newName
    const check = await fetch(`/api/machine/${machineId}/program/${program.programNo}/update-name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    })

    const status = check.ok ? 'success' : 'fail'
    notification(check, t(`contextMenu.changeNameNotification.${status}`, { programNo: program.programNo }))
  }

  async function getProcessTypes() {
    const { fetch } = useKeycloak()
    return await fetch('/api/process')
  }

  async function changeProcessType(selectedRow, newType: number, machineId: number) {
    const { fetch } = useKeycloak()
    for (const row of selectedRows) {
      const program = await getProgram(row.programNo, machineId)
      program.typeId = newType
      try {
        const check = await fetch(`/api/machine/${machineId}/program`, {
          method: 'PUT',
          body: {
            program,
          },
        })
        const status = check ? 'success' : 'fail'
        notification(!!check, t(`contextMenu.changeProcessTypeNotification.${status}`, { programNo: program.programNo }))
      } catch (e) {
        notification(false, t(`contextMenu.changeProcessTypeNotification.fail`, { programNo: program.programNo }))
      }
    }
  }

  async function sendProgram(programs: Array<any>, machineId: number) {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()
    editor.isLoading = true
    for (const program of programs) {
      const check = await fetch(`/api/machine/${machineId}/program/${program.programNo}/upload`, { method: 'POST' })
      const status = check?.name ? 'failedToConnectMachine' : check ? 'success' : 'fail'
      notification(check, t(`contextMenu.send.${status}`, { name: program.name }))
    }
    editor.isLoading = false
  }

  async function getRemoteProgram(programs: ProgramTable[], machineId: number) {
    const { fetch } = useKeycloak()
    const editor = useEditorStore()
    editor.isLoading = true
    for (const program of programs) {
      const check = await fetch(`/api/machine/${machineId}/program/${program.programNo}/download`, { method: 'POST' })
      const status = check ? 'success' : 'fail'
      notification(check, t(`contextMenu.get.${status}`, { name: program.name }))
    }
    editor.isLoading = false
  }

  async function sendProgramToMachines(programs: Array<any>, machines: Array<any>, machineId: number) {
    const { fetch } = useKeycloak()
    for (const machine of machines) {
      const m_id = getMachineId(machine)
      for (const program of programs) {
        // TODO: Maybe do not need to call machines * programs much endpoint machines can be taken through body and then for of loop on backend for faster runtime
        // but think about notification logic on each paste operation maybe bulk notification can be shown for each machine idk ...later.
        const editor = useEditorStore()
        editor.isLoading = true
        const check = await fetch(`/api/machine/${machineId}/program/${program.programNo}/uploadTo`, { method: 'POST', body: { machineId: m_id } })
        editor.isLoading = false
        const status = check?.statusCode === 'ECONNREFUSED' ? 'failedToConnectMachine' : check ? 'success' : 'fail'
        notification(check, t(`contextMenu.getInMachine.${status}`, { name: program.name, machine: m_id }))
      }
    }
  }

  async function deleteProgramFromMachine(programs: Array<any>, machines: Array<any>, source: string) {
    const { fetch } = useKeycloak()
    for (const machine of machines) {
      const m_id = getMachineId(machine)
      for (const program of programs) {
        const check = await fetch(`/api/machine/${m_id}/program/${program.programNo}`, {
          method: 'DELETE',
          query: {
            source,
          },
        })
        const status = check ? 'success' : 'fail'
        notification(check, t(`contextMenu.deleteFromMultiMachineNotification.${status}`, { name: program.name, programNo: program.programNo, machineId: m_id }))
      }
    }
  }

  function getMachineId(machine: any) {
    let m_id
    if (typeof machine === 'string') {
      m_id = Number(machine.split('-')[1])
    } else if (typeof machine === 'number') {
      m_id = machine
    }
    return m_id
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

  async function concatenatePrograms(programs, details, machineId: number) {
    // console.log('Don\'t know how to concatenate programs. Will steps added ent-to-end or is there any other logic on that?')
    const concatedProgram: Program = {
      icon: null,
      programNo: details.programNo,
      typeName: details.processType.label,
      machineId,
      machineName: '',
      name: details.name,
      author: null,
      comment: null,
      typeId: details.processType.value,
      createdAt: details.creationTime,
      updatedAt: details.creationTime,
      steps: [],
      duration: 0,
      updatedAtTBB: null,
      programState: ProgramStatus.EXISTS_ONLY_ON_DATABASE,
      isChanged: false,
      tbbProgramChangedEvent: null,
      autoChemReq: 0,
      autoDyeReq: 0,
      manChemReq: 0,
      manDyeReq: 0,
      totalChemReq: 0,
      totalDyeReq: 0,
    }
    // await deleteProgram(programs, 1)
    for (const program of programs) {
      (await getProgram(program.programNo, machineId)).steps.forEach((step) => {
        concatedProgram.steps.push(step)
      })
    }
    const returnValue = await createProgram(concatedProgram, machineId)
    if (returnValue)
      notification(true, t('contextMenu.pasteNotification.success', { name: concatedProgram.name, programNo: concatedProgram.programNo }))
    else
      notification(false, t('contextMenu.pasteNotification.fail', { name: concatedProgram.name, programNo: concatedProgram.programNo }))
  }

  async function createProgram(program: Program, machineId: number): Promise<number> {
    const { fetch } = useKeycloak()
    try {
      return await fetch(`/api/machine/${machineId}/program`, {
        method: 'POST',
        body: {
          programNo: program.programNo,
          program,
        },
      })
    } catch (e) {
      return 0
    }
  }

  return {
    getCopiedValues,
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
    changeName,
    changeProcessType,
    comparison,
    addToComparisonBasket,
    clearComparisonBasket,
    getComparisonBasket,
    isThereCopiedValue,
  }
}
