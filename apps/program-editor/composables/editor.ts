import { defineStore } from 'pinia'
import { ref } from 'vue'
import { klona } from 'klona/lite'
import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import type { BatchParameter, CommandFormula, CommandParameter, Machine, MachineCommand, MachineConstant, ParameterItem, ParameterSelections, ProcessType, Program, ProgramHeader, ProgramStep, ProgramStepCommand, ProgramTable, ioListItem } from '~/shared/types'
import { capitalize } from '~/shared/utils'
import { CommandType } from '~/shared/constants'
import { calculateProgramDuration } from '~/shared/formula'

export type EditorStore = ReturnType<typeof useEditorStore>

export const useEditorStore = defineStore('editor', () => {
  const program = ref<Program>(createProgram())
  const machine = ref<Machine>(createMachine())
  const selectedPrograms = ref<ProgramTable[]>([])
  const allProcessType = ref<ProcessType[]>([])
  const allPrograms = ref<ProgramHeader[]>([])
  const selectedCommand = ref<MachineCommand | null>(null)
  const selectedStep = ref<number>(-1)
  const selectedParallelStep = ref<number>(-1)
  const isLoading = ref<boolean>(false)
  const popupNewProgramVisible = ref(false)
  const popupSaveAsProgramVisible = ref(false)
  const popupCommandListVisible = ref(false)
  const popupCommandDetailVisible = ref(false)
  const newVersionDialog = ref(false)
  const leftDrawerOpen = ref(true)
  const rightDrawerOpen = ref(false)
  let lastStepId = 0
  let lastCommandId = 0

  const { t } = useI18n()
  const route = useRoute()
  const errorIds = ref(new Set<string>())
  const { notifySuccess, notifyError } = useNotify()
  const { fetch } = useKeycloak()

  const theoricDuration = computed(() => formatDuration(calculateProgramDuration(program.value, machine.value)))

  const treatmentSettings = ref<{ optimizedEnable: boolean }>({
    optimizedEnable: false,
  })
  async function fetchTreatmentSettings() {
    treatmentSettings.value = await fetch('/api/treatment-settings')
  }

  fetchTreatmentSettings()

  async function changeMachine(id: number) {
    selectedPrograms.value = []
    const MACHINE_PATH_RE = /^\/machine\/\d+$/
    if (machine.value.id !== id) {
      machine.value = createMachine()
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
    const stepIndex = selectedStep.value !== -1 ? selectedStep.value : program.value.steps.length - 1

    emptyStep.parallelCommands = stepIndex > 0 ? klona(program.value.steps[stepIndex].parallelCommands) : []
    for (const command of emptyStep.parallelCommands) {
      command.commandId = lastCommandId++
    }

    program.value.steps.splice(stepIndex + 1, 0, emptyStep)
    selectedParallelStep.value = -1
    selectedStep.value = stepIndex + 1
    nextTick(() => {
      scrollPage(stepIndex + 1, true)
    })
  }

  function newStepCommand(commandNo: number, stepIndex: number) {
    const newStep = createEmptyStep()
    const machineCommand = machine.value?.commands.get(commandNo)

    if (!machineCommand) {
      return notifyError(t('error.machineCommandNotFound', { commandNo, machineId: machine.value?.id }))
    }

    if (machineCommand.commandType === CommandType.PARALLEL) {
      return notifyError(t('error.cannotMainCommand', { commandNo }))
    }

    updateCommand(newStep.mainCommand, commandNo)

    newStep.parallelCommands = stepIndex > 0 ? klona(program.value.steps[stepIndex].parallelCommands) : []
    for (const command of newStep.parallelCommands) {
      command.commandId = lastCommandId++
    }
    program.value.steps.splice(stepIndex + 1, 0, newStep)
    selectedParallelStep.value = -1
    selectedStep.value = stepIndex + 1
    nextTick(() => {
      scrollPage(stepIndex + 1, true)
    })
  }

  /**
   * Belirtilen stepIndex'taki step'i scroll eder.
   * @param stepIndex - Step index
   * @param isExpanded - Parallel stepleri göster
   * @returns {void}
   */
  function scrollPage(stepIndex: number, isExpanded?: boolean): void {
    const el = document.getElementById(`step-${stepIndex}`)
    if (!el)
      return

    setTimeout(() => {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    }, 100)

    const button = el.querySelector('.expand-btn') as HTMLElement | null
    if (!button)
      return

    const icon = button.querySelector('.material-icons')
    if (isExpanded && icon && icon.textContent === 'expand_more') {
      button.click()
    }
  }

  function newParallelStep() {
    const index = selectedStep.value !== -1 ? selectedStep.value : program.value.steps.length - 1
    const parallelIndex = selectedParallelStep.value !== -1 ? selectedParallelStep.value : program.value.steps[index].parallelCommands.length
    program.value.steps[index].parallelCommands.splice(parallelIndex + 1, 0, createEmptyCommand())

    nextTick(() => {
      scrollPage(index, true)
    })
  }

  function newParallelStepCommand(commandNo: number, stepIndex: number) {
    const machineCommand = machine.value?.commands.get(commandNo)
    if (!machineCommand) {
      return notifyError(t('error.machineCommandNotFound', { commandNo, machineId: machine.value?.id }))
    }

    const newCommand = createEmptyCommand()
    updateCommand(newCommand, commandNo)
    program.value.steps[stepIndex].parallelCommands.push(newCommand)
  }

  function updateCommand(command: ProgramStepCommand, commandNo: number) {
    const machineCommand = machine.value?.commands.get(commandNo)
    if (!machineCommand) {
      return notifyError(t('error.machineCommandNotFound', { commandNo, machineId: machine.value?.id }))
    }

    command.commandNo = machineCommand.commandNo

    command.parameters = machineCommand.parameters
      .filter(parameter => parameter.editable || parameter.useFormula)
      .map(parameter => ({
        index: parameter.index,
        value: parameter.value,
        optimized: false,
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

  async function onSubmit(newProgram?: Program) {
    isLoading.value = true
    const firstId = errorIds.value.values().next().value
    if (firstId) {
      const el = document.getElementById(firstId)
      const parentEl = el?.closest('.q-item__section--main')
      const stepIndex = parentEl?.children[0].id?.split('-').pop()

      scrollPage(Number(stepIndex), true)
      notifyError(t('saveProgram.incorrect'))
    } else {
      if (newProgram) {
        if (await insertProgram(newProgram)) {
          notifySuccess(t('saveProgram.success'))
        } else {
          notifyError(t('saveProgram.fail'))
        }
      } else {
        if (await updateProgram()) {
          notifySuccess(t('saveProgram.success'))
        } else {
          notifyError(t('saveProgram.fail'))
        }
      }
    }
    popupNewProgramVisible.value = false
    popupSaveAsProgramVisible.value = false
    isLoading.value = false
  }

  async function onSaveAs() {
    isLoading.value = true
    const firstId = errorIds.value.values().next().value
    if (firstId) {
      const el = document.getElementById(firstId)
      const parentEl = el?.closest('.q-item__section--main')
      const stepIndex = parentEl?.children[0].id?.split('-').pop()

      scrollPage(Number(stepIndex), true)
      notifyError(t('saveProgram.incorrect'))
    } else {
      if (await updateProgram()) {
        notifySuccess(t('saveProgram.success'))
      } else {
        notifyError(t('saveProgram.fail'))
      }
    }
    isLoading.value = false
  }

  function onReset() {
    window.location.reload()
  }

  async function deleteProgram(machineId: number, programNo: number) {
    await fetch(`/api/machine/${machineId}/program/${programNo}`, {
      method: 'DELETE',
      body: {
        programNo,
      },
    })
  }

  function deleteStep(stepIndex?: number) {
    if (stepIndex !== undefined) {
      program.value.steps.splice(stepIndex, 1)
    } else {
      if (selectedStep.value !== -1 && program.value.steps.length > 0) {
        program.value.steps.splice(selectedStep.value, 1)
      }
    }
    // selectedStep.value = -1
  }

  function deleteParallelStep(stepIndex?: number, parallelIndex?: number) {
    if (stepIndex !== undefined && parallelIndex !== undefined) {
      program.value.steps[stepIndex]?.parallelCommands.splice(parallelIndex, 1)
    } else {
      if (selectedStep.value !== -1 && program.value.steps.length > 0) {
        if (program.value.steps[selectedStep.value].parallelCommands.length > 0) {
          program.value.steps[selectedStep.value].parallelCommands.splice(selectedParallelStep.value, 1)
        }
      }
    }
    // selectedParallelStep.value = -1
  }

  async function fetchProgram(machineId: number, programNo: number) {
    selectedStep.value = -1
    selectedParallelStep.value = -1
    lastStepId = 0
    lastCommandId = 0
    program.value = await fetch<Program>(`/api/machine/${machineId}/program/${programNo}`)
    for (const step of program.value.steps) {
      step.stepId = lastStepId++
      for (const command of step.parallelCommands) {
        command.commandId = lastCommandId++
      }
      lastCommandId = 0
    }
  }

  async function fetchMachine(machineId: number) {
    const machineData = await fetch<Machine>(`/api/machine/${machineId}`)
    machine.value = machineData
  }

  async function fetchMachineCommands(machineId: number, editable?: boolean) {
    const machineCommandsData = await fetch<MachineCommand[]>(`/api/machine/${machineId}/commands${editable ? '?editable=true' : ''}`)
    if (machine.value) {
      if (!(machine.value.commands instanceof Map)) {
        machine.value.commands = new Map()
      }

      machine.value.commands.clear()
      for (const command of machineCommandsData) {
        machine.value?.commands.set(command.commandNo, command)
      }
    }
  }

  async function fetchAllMachine() {
    return await fetch('/api/machine')
  }

  async function fetchMachineGroup() {
    return await fetch('/api/machine-group')
  }

  async function fetchAllPrograms(machineId: number) {
    allPrograms.value = await fetch<ProgramHeader[]>(`/api/machine/${machineId}/program`)
  }

  async function fetchAllProcessTypes() {
    allProcessType.value = (await fetch<ProcessType[]>('/api/process')).map(type => ({
      ...type,
      label: capitalize(type.label),
    }))
  }

  function createMachine(): Machine {
    return {
      id: 0,
      name: '',
      commands: new Map<number, MachineCommand>(),
      batchParameters: [],
      commandFormulas: [],
      constants: [],
      treatmentParameters: [],
    }
  }

  function createProgram() {
    return {
      name: '',
      icon: '',
      programNo: 0,
      duration: 0,
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
      tbbProgramChangedEvent: 0,
      programState: 1,
      updatedAtTBB: null,
    }
  }

  async function updateProgram() {
    try {
      await fetch(`/api/machine/${route.params.machine_id}/program`, {
        method: 'PUT',
        body: {
          program: program.value,
        },
      })
      return true
    } catch (error: any) {
      if (error.statusCode === 400) {
        if (error.data.data.code === 'PROGRAM_TREATMENT_COMMAND_LIMIT') {
          notifyError(t('treatmentParameterLimitReached', {
            limit: error.data.data.detail.limit,
            commandNo: error.data.data.detail.commandNo,
          }))
        }
      }
      return false
    }
  }

  async function insertProgram(newProgram: Program) {
    try {
      await fetch(`/api/machine/${newProgram.machineId}/program`, {
        method: 'POST',
        body: {
          program: newProgram,
        },
      })

      navigateTo(`/machine/${newProgram.machineId}/program/${newProgram.programNo}`)
      return true
    } catch (error: any) {
      if (error.statusCode === 400) {
        if (error.data.data.code === 'PROGRAM_TREATMENT_COMMAND_LIMIT') {
          notifyError(t('treatmentParameterLimitReached', {
            limit: error.data.detail.limit,
            commandNo: error.data.data.detail.commandNo,
          }))
        }
      }
      return false
    }
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
    machine,
    selectedPrograms,
    selectedStep,
    selectedParallelStep,
    isLoading,
    errorIds,
    newVersionDialog,
    allProcessType,
    allPrograms,
    selectedCommand,
    lastStepId,
    lastCommandId,
    popupNewProgramVisible,
    popupSaveAsProgramVisible,
    popupCommandListVisible,
    popupCommandDetailVisible,
    leftDrawerOpen,
    rightDrawerOpen,
    theoricDuration,
    treatmentSettings,
    changeMachine,
    fetchProgram,
    fetchMachine,
    fetchMachineCommands,
    fetchAllMachine,
    fetchMachineGroup,
    fetchAllPrograms,
    createMachine,
    createProgram,
    updateProgram,
    onSubmit,
    onSaveAs,
    onReset,
    insertProgram,
    insertStep,
    newStep,
    newStepCommand,
    newParallelStep,
    newParallelStepCommand,
    updateCommand,
    deleteProgram,
    deleteStep,
    deleteParallelStep,
    changeSelection,
    getPathElement,
    fetchAllProcessTypes,
    scrollPage,
  }
})
