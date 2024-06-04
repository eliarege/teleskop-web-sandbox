import { defineStore } from 'pinia'
import { ref } from 'vue'
import { klona } from 'klona/lite'
import type { CommandIO, Machine, MachineCommand, MachineInfo, ParameterItem, Program, ProgramStep, ProgramStepCommand, ioListItem } from '~/shared/types'

export type EditorStore = ReturnType<typeof useEditorStore>

export const useEditorStore = defineStore('editor', () => {
  const program = ref<Program>(createProgram())
  const machine = ref<Machine>(createMachine())
  const selectedRows = ref([])
  const selectedStep = ref<number>(-1)
  const selectedParallelStep = ref<number>(-1)
  const route = useRoute()
  let lastStepId = 0
  let lastCommandId = 0
  let isLoading = false
  let isCommandLoading = false
  const isIncorrectInput = ref<number>(0)
  const isDragging = true

  const { t } = useI18n()
  const errorIds = ref(new Set<string>())
  const { notifySuccess, notifyError } = useNotify()

  async function changeMachine(id: number, name: string) {
    selectedRows.value = []
    const MACHINE_PATH_RE = /^\/machine\/\d+$/
    machine.value = {
      id,
      name,
      commands: new Map(),
    }
    // Replace only if navigating from /machine/:id
    const replace = MACHINE_PATH_RE.test(route.path)
    await navigateTo({
      path: `/machine/${id}`,
      replace,
    })
  }

  function createEmptyStep() {
    return {
      stepId: lastStepId++,
      mainCommand: createEmptyCommand(),
      parallelCommands: [] as ProgramStepCommand[],
    }
  }

  function createEmptyCommand() {
    return {
      commandId: lastCommandId++,
      commandNo: null,
      parameters: [] as ParameterItem[],
      ioList: [] as ioListItem[],
    }
  }

  function newStep() {
    const emptyStep = createEmptyStep()

    let index = 0
    if (selectedStep.value !== -1) {
      index = selectedStep.value
    } else {
      index = program.value.steps.length - 1
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }

    emptyStep.parallelCommands = index > 0 ? klona(program.value.steps[index].parallelCommands) : []
    for (const command of emptyStep.parallelCommands) {
      command.commandId = lastCommandId++
    }

    program.value.steps.splice(index + 1, 0, emptyStep)
    selectedParallelStep.value = -1
    selectedStep.value = index + 1
  }

  function newStepCommand(commandNo: number, stepIndex: number) {
    const newStep = createEmptyStep()
    updateCommand(newStep.mainCommand, commandNo)

    newStep.parallelCommands = stepIndex > 0 ? klona(program.value.steps[stepIndex].parallelCommands) : []
    for (const command of newStep.parallelCommands) {
      command.commandId = lastCommandId++
    }
    program.value.steps.splice(stepIndex + 1, 0, newStep)
    selectedParallelStep.value = -1
    selectedStep.value = stepIndex + 1
  }

  function newParallelStep() {
    const index = selectedStep.value !== -1 ? selectedStep.value : program.value.steps.length
    const parallelIndex = selectedParallelStep.value !== -1 ? selectedParallelStep.value : program.value.steps[index].parallelCommands.length
    program.value.steps[index].parallelCommands.splice(parallelIndex + 1, 0, createEmptyCommand())
  }

  function newParallelStepCommand(commandNo: number, stepIndex: number) {
    const newCommand = createEmptyCommand()
    updateCommand(newCommand, commandNo)
    program.value.steps[stepIndex].parallelCommands.push(newCommand)
  }

  function updateCommand(command: ProgramStepCommand, commandNo: number) {
    const machineCommand = machine.value?.commands.get(commandNo)

    if (!machineCommand) {
      throw new Error('Machine Command Not Found!')
    }

    command.commandNo = machineCommand.commandNo

    command.parameters = machineCommand.parameters
      .filter(parameter => parameter.editable)
      .map(parameter => ({
        index: parameter.index,
        value: parameter.defaultValue,
      }))

    command.ioList = machineCommand.ioList
      .filter(io => io.selectable)
      .map(io => ({
        ioId: io.physicalId,
        ioIndex: io.index,
        value: io.selections
          .filter(selection => selection.defaultValue)
          .map(selection => [selection.type, selection.physicalId]),
      }))
  }

  async function onSubmit() {
    const firstId = errorIds.value.values().next().value
    if (firstId) {
      const el = document.getElementById(firstId)
      const parentEl = el?.closest('.q-item__section--main')
      const button = parentEl?.querySelector('button')

      if (button?.children[1].children[0].innerHTML === 'expand_more')
        button.click()

      setTimeout(() => {
        el?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
      }, 100)

      notifyError(t('saveProgram.incorrect'))
    } else {
      isLoading = true
      if (await updateProgram()) {
        notifySuccess(t('saveProgram.success'))
      } else {
        notifyError(t('saveProgram.fail'))
      }
      isLoading = false
    }
  }

  function onReset() {
    window.location.reload()
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
  async function fetchProgram(machineId: number, programNo: number) {
    selectedStep.value = -1
    isLoading = true
    const programData = await $fetch<Program>(`/api/machine/${machineId}/program/${programNo}`)
    for (const step of programData.steps) {
      step.stepId = lastStepId++
      for (const command of step.parallelCommands) {
        command.commandId = lastCommandId++
      }
    }
    program.value = programData
    isLoading = false
  }

  async function fetchMachine(machineId: number) {
    isLoading = true
    const machineData = await $fetch<Machine>(`/api/machine/${machineId}`)
    machine.value = machineData
    isLoading = false
  }

  async function fetchMachineCommands(machineId: number) {
    isCommandLoading = true
    const machineCommandsData = await $fetch<MachineCommand[]>(`/api/machine/${machineId}/commands?editable=true`)
    if (machine.value) {
      if (!(machine.value.commands instanceof Map)) {
        machine.value.commands = new Map()
      }

      machine.value.commands.clear()
      for (const command of machineCommandsData) {
        machine.value?.commands.set(command.commandNo, command)
      }
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

  function createMachine() {
    return {
      id: 0,
      name: '',
      commands: new Map<number, MachineCommand>(),
    }
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
    changeMachine,
    program,
    machine,
    selectedRows,
    selectedStep,
    selectedParallelStep,
    isLoading,
    isCommandLoading,
    isIncorrectInput,
    isDragging,
    errorIds,
    fetchProgram,
    fetchMachine,
    fetchMachineCommands,
    fetchAllMachine,
    fetchMachineGroup,
    fetchPrograms,
    createMachine,
    createProgram,
    updateProgram,
    onSubmit,
    onReset,
    insertProgram,
    insertStep,
    newStep,
    newStepCommand,
    newParallelStep,
    newParallelStepCommand,
    updateCommand,
    deleteStep,
    deleteParallelStep,
    changeSelection,
    getPathElement,
    fetchAllProcessTypes,
  }
})
