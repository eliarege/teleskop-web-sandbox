import { method } from 'lodash-es'
import { defineStore } from 'pinia'
import { notification } from '~/shared/functions'
import type { Program } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'

interface ProgramHeader {
  programNo: number
  name: string
}
export interface ContextMenuStore {
  getCopiedValues: () => Array<{ machine: number, program: Program, newProgramNo?: number }>
  comparisonBasketLength: () => number
  copy: (data: Array<{ program: Program }>, fromMachine: number) => void
  paste: (machineId: number, directPasteValues?: Array<{ machine: number, program: Program, newProgramNo?: number }>) => Promise<Array<{ machine: number, program: Program }>>
  setCtx: (ctx?: any) => void
  deleteProgram: (selectedRows: Array<ProgramHeader>, selectedOption: number, machineId: number) => Promise<void>
  getProgram: (programNo: number, machineId: number) => Promise<Program>
  changeName: (programParam: { programNo: number }, newName: string, machineId: number) => Promise<void>
  getProcessTypes: () => Promise<any[]>
  changeProcessType: (selectedRows: Array<{ programNo: number }>, newType: number, machineId: number) => Promise<void>
  sendProgram: (programs: Array<ProgramHeader>, machineId: number) => Promise<void>
  getRemoteProgram: (programs: Array<{ programNo: number, programState: string, name: string }>, machineId: number) => Promise<void>
  sendProgramToMachines: (programs: Array<ProgramHeader>, machines: Array<any>, machineId: number) => Promise<void>
  deleteProgramFromMachine: (programs: Array<ProgramHeader>, machines: Array<any>, source: string) => Promise<void>
  deleteVersion: (versions: Array<{ programNo: number, version: number, name: string }>, machineId: number) => Promise<void>
  fetchVersions: (programNo: number, machineId: number) => Promise<any[]>
  concatenatePrograms: (programs: Array<{ programNo: number }>, details: { programNo: number, processType: { label: string, value: number }, name: string, creationTime: Date }, machineId: number) => Promise<void>
  comparison: () => void
  addToComparisonBasket: (elements: any[]) => void
  clearComparisonBasket: () => void
  isThereCopiedValue: ComputedRef<boolean>
}

export function useContextMenuStore(ctx?: any): ContextMenuStore {
  const copiedValues = ref([] as Array<{ machine: number, program: any, newProgramNo?: number }>)
  let comparsionBasket = [] as Array<any>
  // const machineId = Number(route.params.machine_id)
  let t = function (param: string, ...args: any[]) {
    return param
  }
  function setCtx(ctx?: any) {
    t = ctx?.t
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

  function addToComparisonBasket(e: any) {
    e.forEach((element) => {
      if (!comparsionBasket.includes(element))
        comparsionBasket.push(element)
    })
    console.log(comparsionBasket)
  }

  function comparison() {

  }

  function comparisonBasketLength() {
    return comparsionBasket.length
  }

  function copy(data: any, fromMachine: number) {
    copiedValues.value = []
    data.forEach((program) => {
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
    return await $fetch(`/api/machine/${machineId}/program`, {
      method: 'POST',
      body: {
        newProgramNo: Number(copiedValue.newProgramNo),
        programNo: Number(copiedValue.program.programNo),
        machineIdOfCopiedProgram: copiedValue.machine,
      },
    })
  }

  async function deleteProgram(selectedRows: any[], selectedOption: number, machineId: number) {
    const query = `source=${selectedOption}`
    for (const program of selectedRows) {
      const check = await $fetch(`/api/machine/${machineId}/program/${program.programNo}?${query}`, {
        method: 'DELETE',
      })
      const status = check ? 'success' : 'fail'
      notification(check, t(`contextMenu.delete.${status}`, { programNo: program.programNo, name: program.name }))
    }
  }
  async function getProgram(programNo: number, machineId: number): Promise<Program> {
    return await $fetch(`/api/machine/${machineId}/program/${programNo}`)
  }

  async function changeName(programParam: any, newName: string, machineId: number) {
    const program = await getProgram(programParam.programNo, machineId)
    program.name = newName
    const check = await $fetch(`/api/machine/${machineId}/program/${program.programNo}/update-name`, {
      method: 'PUT',
      body: {
        newName,
      },
    })
    const status = check ? 'success' : 'fail'
    notification(check, t(`contextMenu.changeNameNotification.${status}`, { programNo: program.programNo }))
  }

  async function getProcessTypes() {
    return await $fetch('/api/process')
  }

  async function changeProcessType(selectedRows, newType: number, machineId: number) {
    for (const row of selectedRows) {
      const program = await getProgram(row.programNo, machineId)
      program.typeId = newType
      const check = await $fetch(`/api/machine/${machineId}/program`, {
        method: 'PUT',
        body: {
          program,
        },
      })
      const status = check ? 'success' : 'fail'
      notification(!!check, t(`contextMenu.changeProcessTypeNotification.${status}`, { programNo: program.programNo }))
    }
  }

  async function sendProgram(programs: Array<any>, machineId: number) {
    for (const program of programs) {
      const check = await $fetch(`/api/machine/${machineId}/program/${program.programNo}/upload`, { method: 'POST' })
      const status = check?.name ? 'failedToConnectMachine' : check ? 'success' : 'fail'
      notification(check, t(`contextMenu.send.${status}`, { name: program.name }))
    }
  }

  async function getRemoteProgram(programs: Array<any>, machineId: number) {
    for (const program of programs) {
      let check = false
      if (program.programState === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER) {
        check = await $fetch(`/api/machine/${machineId}/program/${program.programNo}/download`, { method: 'POST' })
      }
      const status = check ? 'success' : 'fail'
      notification(!!check, t(`contextMenu.get.${status}`, { name: program.name }))
    }
  }

  async function sendProgramToMachines(programs: Array<any>, machines: Array<any>, machineId: number) {
    for (const machine of machines) {
      const m_id = getMachineId(machine)
      for (const program of programs) {
        // TODO: Maybe do not need to call machines * programs much endpoint machines can be taken through body and then for of loop on backend for faster runtime
        // but think about notification logic on each paste operation maybe bulk notification can be shown for each machine idk ...later.
        const check = await $fetch(`/api/machine/${machineId}/program/${program.programNo}/uploadTo`, { method: 'POST', body: { machineId: m_id } })
        const status = check?.statusCode === 'ECONNREFUSED' ? 'failedToConnectMachine' : check ? 'success' : 'fail'
        notification(check, t(`contextMenu.getInMachine.${status}`, { name: program.name, machine: m_id }))
      }
    }
  }

  async function deleteProgramFromMachine(programs: Array<any>, machines: Array<any>, source: string) {
    for (const machine of machines) {
      const m_id = getMachineId(machine)
      for (const program of programs) {
        const check = await $fetch(`/api/machine/${m_id}/program/${program.programNo}`, {
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
    for (const version of versions) {
      const check = await $fetch(`/api/machine/${machineId}/program/${version.programNo}/archive/${version.version}`, {
        method: 'DELETE',
      })
      const status = check ? 'success' : 'fail'
      notification(check, t(`contextMenu.delete.${status}`, { programNo: version.programNo, name: version.name }))
    }
  }

  async function fetchVersions(programNo: number, machineId: number): Promise<any[]> {
    return await $fetch(`/api/machine/${machineId}/program/${programNo}/version`)
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
      updatedAt: null,
      steps: [],
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
    return await $fetch(`/api/machine/${machineId}/program`, {
      method: 'POST',
      body: {
        programNo: program.programNo,
        program,
      },
    })
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
    isThereCopiedValue,
  }
}
