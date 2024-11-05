import { klona } from 'klona/lite'
import { isDef } from '@teleskop/utils'
import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import type { CommandTypes, Machine, MachineCommand, MachineGroup, ParameterItem, ProcessType, Program, ProgramFilter, ProgramStep, ProgramStepCommand, ProgramTable, StepIcon, TeleskopSettings, ioListItem } from '~/shared/types'
import { capitalize } from '~/shared/utils'
import { CommandIconMapping, CommandType, TeleskopSettingsIds, commandTypeMaps } from '~/shared/constants'

export type EditorStore = ReturnType<typeof useEditorStore>

export const useEditorStore = defineStore('editor', () => {
  const program = ref<Program>(createProgram())
  const machine = ref<Machine>(createMachine())
  const selectedPrograms = ref<ProgramTable[]>([])
  const allProcessType = ref<ProcessType[]>([])
  const allPrograms = ref<ProgramTable[]>([])
  const selectedCommand = ref<MachineCommand | null>(null)
  const selectedSteps = ref<ProgramStep[]>([])
  const selectedParallelStep = ref<number>(-1)
  const isLoading = ref<boolean>(false)
  const popupCommandListVisible = ref(false)
  const popupCommandDetailVisible = ref(false)
  const popupVersionDialog = ref(false)
  const popupTempTimeGraphVisible = ref(false)
  const popupStepCommandGraphVisible = ref(false)
  const leftDrawerOpen = ref(true)
  const rightDrawerOpen = ref(false)
  let lastStepId = 0
  let lastCommandId = 0
  const allStepExpanded = ref(false)

  const { $i18n } = useNuxtApp()
  const { t } = $i18n
  const route = useRoute()
  const errorIds = ref(new Set<string>())
  const { notifySuccess, notifyError } = useNotify()
  const kc = useKeycloak()

  const teleskopSettings = ref<TeleskopSettings>({
    initialTemperature: 25,
    selectedIcons: 0,
    treatmentSettings: {
      optimizedEnable: false,
      optimizedLimit: 10,
    },
  })

  /**
   * Teleskop ayarlarını alır
   * @returns {Promise<void>}
   */
  async function fetchTeleskopSettings(): Promise<void> {
    teleskopSettings.value = await kc.fetch('/api/teleskop-settings')
  }

  /**
   * Makineyi degistirir
   * @param id - Makine ID
   * @returns {Promise<void>}
   */
  async function changeMachine(id: number): Promise<void> {
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

  /**
   * Yeni step olusturur
   * @returns {ProgramStep} - Yeni step
   */
  function createEmptyStep(): ProgramStep {
    return {
      stepId: lastStepId++,
      mainCommand: createEmptyCommand(),
      parallelCommands: [] as ProgramStepCommand[],
    }
  }

  /**
   * Yeni komut olusturur
   * @returns {ProgramStepCommand} - Yeni step
   */
  function createEmptyCommand(): ProgramStepCommand {
    return {
      commandId: lastCommandId++,
      commandNo: null,
      parameters: [] as ParameterItem[],
      ioList: [] as ioListItem[],
    }
  }

  /**
   * Programa step ekler
   * @returns {void}
   */
  function newStep(): void {
    const emptyStep = createEmptyStep()
    const selectedIndex = program.value.steps.findIndex(step => step.stepId === selectedSteps.value[0]?.stepId)
    const stepIndex = selectedIndex !== -1 ? selectedIndex : program.value.steps.length - 1

    emptyStep.parallelCommands = stepIndex > 0 ? klona(program.value.steps[stepIndex].parallelCommands) : []
    for (const command of emptyStep.parallelCommands) {
      command.commandId = lastCommandId++
    }

    program.value.steps.splice(stepIndex + 1, 0, emptyStep)
    selectedParallelStep.value = -1
    selectedSteps.value = [program.value.steps[stepIndex + 1]]
    nextTick(() => {
      scrollPage(stepIndex + 1, true)
    })
  }

  /**
   * Belirtilen stepIndex'e step ekler
   * @param commandNo - Komut numarası
   * @param stepIndex - Step index
   * @returns {void}
   */
  function newStepCommand(commandNo: number, stepIndex: number): void {
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
    selectedSteps.value = [program.value.steps[stepIndex + 1]]
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

  /**
   * Programa parallel step ekler
   * @returns {void}
   */
  function newParallelStep(): void {
    const index = program.value.steps.findIndex(step => step.stepId === selectedSteps.value[0]?.stepId)
    const mainIndex = index < 0 ? program.value.steps.length - 1 : index
    const parallelIndex = program.value.steps[mainIndex].parallelCommands.length - 1
    program.value.steps[mainIndex].parallelCommands.splice(parallelIndex + 1, 0, createEmptyCommand())

    nextTick(() => {
      scrollPage(mainIndex, true)
    })
  }

  /**
   * Belirtilen stepIndex'e parallel step ekler
   * @param commandNo - Komut numarası
   * @param stepIndex - Step index
   * @returns {void}
   */
  function newParallelStepCommand(commandNo: number, stepIndex: number): void {
    const machineCommand = machine.value?.commands.get(commandNo)
    if (!machineCommand) {
      return notifyError(t('error.machineCommandNotFound', { commandNo, machineId: machine.value?.id }))
    }

    const newCommand = createEmptyCommand()
    updateCommand(newCommand, commandNo)
    program.value.steps[stepIndex].parallelCommands.push(newCommand)
  }

  /**
   * Belirtilen komutu değiştirir
   * @param command - Program komutu
   * @param commandNo - Komut numarası
   * @returns {void}
   */
  function updateCommand(command: ProgramStepCommand, commandNo: number): void {
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

  /**
   * Programı kaydeder
   * @param newProgram - Program
   * @returns {Promise<void>}
   */
  async function onSubmit(newProgram?: Program): Promise<void> {
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
        if (allPrograms.value.some(p => p.programNo === newProgram.programNo)) {
          notifyError(t('input.unique', { field: t('program.programNo') }))
        } else {
          if (await insertProgram(newProgram)) {
            notifySuccess(t('saveProgram.success'))
          } else {
            notifyError(t('saveProgram.fail'))
          }
        }
      } else {
        if (await updateProgram()) {
          notifySuccess(t('saveProgram.success'))
        } else {
          notifyError(t('saveProgram.fail'))
        }
      }
    }
    isLoading.value = false
  }

  /**
   * Programı veri tabanına kaydet
   * @returns {Promise<void>}
   */
  async function onSaveAs(): Promise<void> {
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

  /**
   * Programı veri tabanından sil
   * @param machineId - Makine ID
   * @param programNo - Program no
   * @returns {Promise<void>}
   */
  async function deleteProgram(machineId: number, programNo: number): Promise<void> {
    await kc.fetch(`/api/machine/${machineId}/program/${programNo}`, {
      method: 'DELETE',
      body: {
        programNo,
      },
    })
  }

  /**
   * Sondan basa dogru iterasyon yaparak elemanları sil
   * @param stepIndex - Silinecek step index
   * @returns {void}
   */
  function deleteStep(stepIndex?: number): void {
    if (isDef(stepIndex)) {
      program.value.steps.splice(stepIndex, 1)
    } else {
      // Sondan başa doğru iterasyon yaparak elemanları sil
      for (let i = selectedSteps.value.length - 1; i >= 0; i--) {
        const index = program.value.steps.findIndex(s => s.stepId === selectedSteps.value[i].stepId)
        if (index !== -1) {
          program.value.steps.splice(index, 1)
        }
      }
      selectedSteps.value = []
    }
  }

  /**
   * Parallel step'i sil
   * @param stepIndex - Step index
   * @param parallelIndex - Parallel step index
   * @returns {void}
   */
  function deleteParallelStep(stepIndex?: number, parallelIndex?: number): void {
    if (isDef(stepIndex) && isDef(parallelIndex)) {
      program.value.steps[stepIndex]?.parallelCommands.splice(parallelIndex, 1)
    } else {
      if (selectedSteps.value.length && selectedParallelStep.value !== -1) {
        if (program.value.steps[selectedSteps.value.length].parallelCommands.length > 0)
          program.value.steps[selectedSteps.value.length].parallelCommands.splice(selectedParallelStep.value, 1)
      }
    }
    selectedParallelStep.value = Math.min(
      selectedParallelStep.value,
      program.value.steps[selectedSteps.value.length].parallelCommands.length - 1,
    )
  }

  /**
   * Programı getirir
   * @param machineId - Makine ID
   * @param programNo - Program no
   * @param version - Program versiyonu
   * @returns {Promise<void>}
   */
  async function fetchProgram(machineId: number, programNo: number, version?: number): Promise<void> {
    selectedSteps.value = []
    selectedParallelStep.value = -1
    lastStepId = 0
    lastCommandId = 0
    if (isDef(version))
      program.value = await kc.fetch<Program>(`/api/machine/${machineId}/program/${programNo}/version/${version}`)
    else
      program.value = await kc.fetch<Program>(`/api/machine/${machineId}/program/${programNo}`)
    for (const step of program.value.steps) {
      step.stepId = lastStepId++
      for (const command of step.parallelCommands) {
        command.commandId = lastCommandId++
      }
      lastCommandId = 0
    }
  }

  /**
   * Makineyi getirir
   * @param machineId - Makine ID
   * @returns {Promise<void>}
   */
  async function fetchMachine(machineId: number): Promise<void> {
    const machineData = await kc.fetch<Machine & { commands: MachineCommand[] }>(`/api/machine/${machineId}`)

    machine.value = {
      ...machineData,
      commands: new Map((machineData.commands).map(command => [command.commandNo, command])),
    }
  }

  /**
   * Tüm makineleri getirir
   * @returns {Promise<Machine[]>} - Tüm makineleri getirir
   */
  async function fetchAllMachine(): Promise<Machine[]> {
    return await kc.fetch('/api/machine')
  }

  /**
   * Tüm makine gruplarını getirir
   * @returns {Promise<MachineGroup[]>} Makine grup dizisi içeren bir Promise
   */
  async function fetchMachineGroup(): Promise<MachineGroup[]> {
    return await kc.fetch('/api/machine-group')
  }

  /**
   * Tüm programları getirir
   * @param filter - Filtre
   * @returns {Promise<void>}
   */
  async function fetchAllPrograms(filter?: ProgramFilter ): Promise<void> {
    if (filter) {
      allPrograms.value = await kc.fetch<ProgramTable[]>(`/api/machine/${machine.value.id}/program`, {
        query: {
          programNo: filter.programNo,
          programName: filter.programName,
          processType: filter.processType?.value,
        }
      })
    } else {
      allPrograms.value = await kc.fetch<ProgramTable[]>(`/api/machine/${machine.value.id}/program`)
    }
  }

  /**
   * Tüm proses tiplerini getirir
   * @returns {Promise<void>}
   */
  async function fetchAllProcessTypes() {
    allProcessType.value = (await kc.fetch<ProcessType[]>('/api/process')).map(type => ({
      ...type,
      label: capitalize(type.label),
    }))
  }

  /**
   * Yeni bir makine olusturur
   * @returns {Machine} Makine
   */
  function createMachine(): Machine {
    return {
      id: 0,
      name: '',
      commands: new Map<number, MachineCommand>(),
      batchParameters: [],
      commandFormulas: [],
      constants: [],
      treatmentParameters: [],
      commandTypes: [],
    }
  }

  /**
   * Yeni bir program olusturur
   * @returns {Program} Program
   */
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
      totalChemReq: 0,
      totalDyeReq: 0,
      manChemReq: 0,
      autoChemReq: 0,
      autoDyeReq: 0,
      manDyeReq: 0,
    }
  }

  /**
   * Programı veritabanında günceller
   * @returns {Promise<boolean>} Program güncellendi mi
   */
  async function updateProgram(): Promise<boolean> {
    try {
      await kc.fetch(`/api/machine/${route.params.machine_id}/program`, {
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

  /**
   * Programı veritabanına kaydeder
   * @param newProgram - Program
   * @returns {Promise<boolean>} Program kaydedildi mi
   */
  async function insertProgram(newProgram: Program): Promise<boolean> {
    try {
      await kc.fetch(`/api/machine/${newProgram.machineId}/program`, {
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

  /**
   * Programın belirtilen indexine step ekler
   * @param program - Program
   * @param index - Step index
   * @param step - Step
   * @returns {void}
   */
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
    if (selectedSteps.value.length) {
      selectedSteps.value = []
      selectedParallelStep.value = -1
    } else {
      selectedSteps.value = [program.value.steps[mainIndex]]
    }

    if (selectedParallelStep.value !== -1) {
      selectedParallelStep.value = -1
    } else if (isDef(parallelIndex)) {
      selectedParallelStep.value = parallelIndex
    }
  }

  /**
   * Belirtilen pathe sahip programın bilgilerini getirir
    - 1. Step index
    - 2. Main Komut (mainCommand), Parallel Komut (parallelCommands)
    - 3. Komut index (main ise 0)
    - 4. Parametre (parameters), IO (ioList)
    - 4. IO index
    - 5. IO value index
   *
   * @param path - Path
   * @returns {any} - Program Object
   */
  function getPathElement(path: string): any {
    const pathParts = path.split('.')
    let currentElement = program.value as any
    for (const part of pathParts) {
      if (isDef(currentElement)) {
        currentElement = currentElement[part]
      } else {
        return
      }
    }
    return currentElement
  }

  /**
   * Teleskop ayarlarını günceller
   * @param id - Ayar ID
   * @param value - Deger
   * @returns {Promise<void>}
   */
  async function updateTeleskopSettings(id: TeleskopSettingsIds, value: string) {
    switch (id) {
      case TeleskopSettingsIds.OPTIMIZED_ENABLE:
        teleskopSettings.value.treatmentSettings.optimizedEnable = value === 'true'
        break
      case TeleskopSettingsIds.OPTIMIZED_LIMIT:
        teleskopSettings.value.treatmentSettings.optimizedLimit = Number(value)
        break
      case TeleskopSettingsIds.SELECTED_ICONS:
        teleskopSettings.value.selectedIcons = Number(value)
        break
      case TeleskopSettingsIds.INITIAL_TEMPERATURE:
        teleskopSettings.value.initialTemperature = Number(value)
        break
    }

    await kc.fetch('/api/teleskop-settings', {
      method: 'PUT',
      body: { id, value },
    })
  }

  /**
   * Makine komut tiplerini getirir
   * @param machineId - Makine ID
   * @returns {Promise<void>}
   */
  async function fetchCommandTypes(machineId: number) {
    machine.value.commandTypes = await kc.fetch<CommandTypes[]>(`/api/machine/${machineId}/command-types`)
  }

  /**
   *  Belirtilen komutun ikonunu döndürür
   * @param commandNo Komut numarası
   * @returns {StepIcon | undefined} StepIcon
   */
  function getStepIcon(commandNo: number | undefined): StepIcon | undefined {
    if (!isDef(commandNo))
      return

    const machineCommand = machine.value.commands.get(commandNo)
    if (!machineCommand)
      return

    const machineCommandType = machine.value.commandTypes.find(commandType => commandType.commandNo === commandNo)
    if (!machineCommandType)
      return

    const commandType = commandTypeMaps.find(map => map.value === machineCommandType?.commandType)
    if (!commandType)
      return

    const iconSetting = teleskopSettings.value.selectedIcons
    const isSelected = (Number(iconSetting) & (1 << Number(commandType.index))) > 0

    if (!isSelected || !machineCommand)
      return

    return CommandIconMapping[machineCommand.icon]
  }

  return {
    program,
    machine,
    selectedPrograms,
    selectedSteps,
    selectedParallelStep,
    isLoading,
    errorIds,
    popupVersionDialog,
    allProcessType,
    allPrograms,
    selectedCommand,
    lastStepId,
    lastCommandId,
    popupCommandListVisible,
    popupCommandDetailVisible,
    popupTempTimeGraphVisible,
    popupStepCommandGraphVisible,
    leftDrawerOpen,
    rightDrawerOpen,
    teleskopSettings,
    createEmptyStep,
    createEmptyCommand,
    changeMachine,
    fetchProgram,
    fetchMachine,
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
    getStepIcon,
    fetchTeleskopSettings,
    updateTeleskopSettings,
    fetchCommandTypes,
    allStepExpanded,
  }
})
