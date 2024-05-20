import { defineStore } from 'pinia'
import { ref } from 'vue'
import { klona } from 'klona/lite'
import type { MachineCommand, ParameterItem, Program, ProgramStep, ProgramStepCommand, ioListItem } from '~/shared/types'

export type EditorStore = ReturnType<typeof useEditorStore>

export const useEditorStore = defineStore('editor', () => {
  const program = ref<Program>(createProgram())
  const machineCommands = ref<Map<number, MachineCommand>>(new Map())
  const selectedStep = ref<number>(-1)
  const selectedParallelStep = ref<number>(-1)
  const route = useRoute()
  let lastStepId = 0
  let lastCommandId = 0
  let isLoading = false
  let isCommandLoading = false
  const isIncorrectInput = ref<number>(0)
  const isDragging = false

  const errorIds = ref(new Set<string>())

  function createEmptyStep() {
    return {
      stepId: lastStepId++,
      mainCommand: {} as ProgramStepCommand,
      parallelCommands: [] as ProgramStepCommand[],
    }
  }

  function createEmptyCommand() {
    return {
      commandId: lastCommandId++,
      commandNo: 0,
      parameters: [] as ParameterItem[],
      ioList: [] as ioListItem[],
    }
  }

  function newStep() {
    const step = createEmptyStep()
    let index = 0
    if (selectedStep.value !== -1) {
      index = selectedStep.value
    } else {
      index = program.value.steps.length - 1
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }

    step.parallelCommands = index > 0 ? klona(program.value.steps[index].parallelCommands) : []
    for (const command of step.parallelCommands) {
      command.commandId = lastCommandId++
    }
    program.value.steps.splice(index + 1, 0, step)
    selectedParallelStep.value = -1
    selectedStep.value = index + 1
  }

  function newParallelStep() {
    const index = selectedStep.value !== -1 ? selectedStep.value : program.value.steps.length
    const parallelIndex = selectedParallelStep.value !== -1 ? selectedParallelStep.value : program.value.steps[index].parallelCommands.length
    program.value.steps[index].parallelCommands.splice(parallelIndex + 1, 0, createEmptyCommand())
  }

  function deleteStep(stepIndex?: number) {
    if (stepIndex !== undefined) {
      program.value.steps.splice(stepIndex, 1)
    } else {
      if (selectedStep.value !== -1 && program.value.steps.length > 0) {
        program.value.steps.splice(selectedStep.value, 1)
      }
    }
    selectedStep.value = -1
  }

  function deleteParallelStep(stepIndex?: number, parallelIndex?: number) {
    if (stepIndex !== undefined && parallelIndex !== undefined) {
      program.value.steps[stepIndex].parallelCommands.splice(parallelIndex, 1)
    } else {
      if (selectedStep.value !== -1 && program.value.steps.length > 1) {
        if (program.value.steps[selectedStep.value].parallelCommands.length > 1) {
          program.value.steps[selectedStep.value].parallelCommands.splice(selectedParallelStep.value, 1)
        }
      }
    }
    selectedParallelStep.value = -1
  }

  // TODO: await
  async function fetchProgram() {
    isLoading = true
    const programData = await $fetch<Program>(`/api/machine/${route.params.machine_id}/program/${route.params.program_no}`)
    for (const step of programData.steps) {
      step.stepId = lastStepId++
      for (const command of step.parallelCommands) {
        command.commandId = lastCommandId++
      }
    }
    program.value = programData
    isLoading = false
  }

  async function fetchMachineCommands() {
    isCommandLoading = true
    const machineCommandsData = await $fetch<MachineCommand[]>(`/api/machine/${route.params.machine_id}/commands?editable=true`)
    machineCommands.value.clear()
    for (const command of machineCommandsData) {
      machineCommands.value.set(command.commandNo, command)
    }
    isCommandLoading = false
  }

  async function fetchAllMachine() {
    return await $fetch('/api/machine')
  }

  async function fetchMachineGroup() {
    return await $fetch('/api/machine-group')
  }

  async function fetchPrograms() {
    return await $fetch(`/api/machine/${route.params.machine_id}/program`)
  }

  async function fetchAllProcessTypes() {
    return await $fetch(`/api/process`)
  }

  function createProgram() {
    return {
      name: '',
      icon: '',
      programNo: 0,
      author: '',
      comment: '',
      typeId: 0,
      typeName: '',
      machineId: 0,
      machineName: '',
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isChanged: false,
      tbbProgramChangedEvent: false,
      programState: 0,
      updatedAtTBB: null,
    }
  }

  async function updateProgram() {
    return await $fetch(`/api/machine/${route.params.machine_id}/program`, {
      method: 'PUT',
      body: {
        program: program.value,
      },
    })
  }

  async function insertProgram() {
    return await $fetch(`/api/machine/${route.params.machine_id}/program`, {
      method: 'POST',
      body: {
        program: program.value,
      },
    })
  }

  function insertStep(program: Program, index: number, step: ProgramStep) {
    assertIndex(index, program.steps.length + 1)
    program.steps.splice(index, 0, step)
  }

  /**
   * Belirtilen step'i seçer
   * @param mainIndex - Step index
   * @param parallelIndex - Parallel step index
   * @returns {void}
   */
  function changeSelection(mainIndex: number, parallelIndex?: number): void {
    if (selectedStep.value === mainIndex) {
      selectedStep.value = -1
      selectedParallelStep.value = -1
    } else {
      selectedStep.value = mainIndex
    }
    if (parallelIndex !== undefined) {
      if (selectedParallelStep.value === parallelIndex)
        selectedParallelStep.value = -1
      else {
        selectedParallelStep.value = parallelIndex
        selectedStep.value = -1
      }
    }
  }

  /**
- 1. Step index
- 2. Main Komut (mainCommand), Parallel Komut (parallelCommands)
- 3. Komut index (main ise 0)
- 4. Parametre (parameters), IO (ioList)
- 4. IO index
- 5. IO value index
   *
   * @param path string
   * @returns object | undefined
   */
  function getPathElement(path: string): any {
    const pathParts = path.split('.')
    let currentElement = program.value as any
    for (const part of pathParts) {
      if (currentElement !== undefined) {
        currentElement = currentElement[part]
      } else {
        return undefined
      }
    }
    return currentElement
  }

  return {
    program,
    machineCommands,
    selectedStep,
    selectedParallelStep,
    isLoading,
    isCommandLoading,
    isIncorrectInput,
    isDragging,
    errorIds,
    fetchProgram,
    fetchMachineCommands,
    fetchAllMachine,
    fetchMachineGroup,
    fetchPrograms,
    createProgram,
    updateProgram,
    insertProgram,
    insertStep,
    newStep,
    newParallelStep,
    deleteStep,
    deleteParallelStep,
    changeSelection,
    getPathElement,
    fetchAllProcessTypes,
  }
})
